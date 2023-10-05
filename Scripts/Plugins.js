/*
    Copyright 2023 David Healey

    This file is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This file is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with This file. If not, see <http://www.gnu.org/licenses/>.
*/

namespace Plugins
{
	reg isManual = false;

	inline function automatedInstall(data)
	{
		local fileDir = data.tempDir;
		local files = FileSystem.findFiles(fileDir, "*.lwz", false);
		
		isManual = false;
		
		if (!files.length)
			return Console.print("Something has gone wrong!!");
		
		unpackArchives(files, data);
	}

	inline function manualInstall(file, projectName)
	{
		isManual = true;

		FilePicker.hide();
		
		local data = {};
		data.projectName = projectName;
		data.tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave").createDirectory(projectName);
		data.latestVersion = Installer.getVersionFromFilename(file.toString(file.Filename));
		
		Spinner.show("Installing");
		
		unpackArchives([file], data);
	}
	
	inline function unpackArchives(archives, data)
	{
		for (x in archives)
		{
			x.extractZipFile(data.tempDir, true, function[data](obj)
			{
				extractionCallback(obj, data.bcProgress, data.projectName, data.latestVersion);
			});
		}
	}
	
	inline function extractionCallback(obj, broadcaster, projectName, version)
	{
		obj.Cancel = (obj.Error != "" || abort);

		if (isDefined(broadcaster) && broadcaster != -1)
			broadcaster.progress = {value: Math.round(obj.Progress * 100), message: "Installing"};
			
		if (obj.Status != 2)
			return;

		moveFiles(obj.Target, projectName, version);

		Spinner.hide();
	}
	
	inline function moveFiles(tempDirPath, projectName, version)
	{
		local tempDir = FileSystem.fromAbsolutePath(tempDirPath);
		local files = FileSystem.findFiles(tempDir, "*", false);
		local installedFiles = [];
		
		for (f in files)
		{
			local ext = f.toString(f.Extension);

			if (ext != ".vst3" && ext != ".txt") continue;

			local dir = getPluginLocation(ext == ".au");
			local target = dir.getChildFile(f.toString(f.Filename));

			f.move(target);
			installedFiles.push(target.toString(target.FullPath));
		}
		
		Library.setManifestValue(projectName, "files", installedFiles);
		Library.setManifestValue(projectName, "installedVersion", version);
		
		if (!isManual)
			Downloader.cleanUp();
		else
			Library.updateCatalogue();
	}

	inline function getPluginLocation(type)
	{
		local path;

		switch (Engine.getOS())
		{
			case "OSX":
				if (type == 1)
					path = "/Library/Audio/Plug-Ins/Components";
				else
					path = "/Library/Audio/Plug-ins/VST3";
			break;

			case "LINUX":
				path = "~/.vst3";
				break;

			case "WIN":
				path = "C:\Program Files\Common Files\VST3";
				break;
		}

		if (isDefined(path))
			return FileSystem.fromAbsolutePath(path);
			
		return undefined;
	}
	
	inline function deletePluginFiles(projectName)
	{
		local result = false;
		local filePaths = Library.getManifestValue(projectName, "files");

		for (fp in filePaths)
		{
			local f = FileSystem.fromAbsolutePath(fp);
			
			if (!isDefined(f) || !f.isFile()) continue;

			result = f.deleteFileOrDirectory();
		}
		
		return result;
	}

	inline function uninstall(data, removePresets)
	{
		deletePluginFiles(data.projectName);
		Library.setManifestValue(data.projectName, "installedVersion", -1);
		Library.setManifestValue(data.projectName, "files", []);
		Library.updateCatalogue();
	}
	
	inline function load(projectName)
	{
		Engine.showMessageBox("Load Plugin", projectName + " can't run inside Rhapsody. It needs to be loaded directly within a DAW or plugin host.", 0);
	}
}