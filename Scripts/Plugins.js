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
	reg numZips;
	reg extractionCount;

	inline function automatedInstall(data)
	{
		local files = FileSystem.findFiles(data.tempDir, "*.lwz", false);

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
		numZips = archives.length;
		extractionCount = 0;

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
			
		extractionCount++;
		
		if (extractionCount < numZips)
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

			if (![".vst3", ".component", ".png", ".dat"].contains(ext)) continue;

			local dir;

			if (ext == ".png")
				dir = getImageDirectory(projectName);
			else if (ext == ".dat")
				dir = getAppDataDirectory(projectName);
			else
				dir = getPluginLocation(ext == ".component");

			local target = dir.getChildFile(f.toString(f.Filename));

			f.move(target);

			if (ext != ".png")
				installedFiles.push(target.toString(target.FullPath));
		}

		Library.setManifestValue(projectName, "format", "plugin");
		Library.setManifestValue(projectName, "installedVersion", version);
		Library.setManifestValue(projectName, "files", installedFiles);

		if (isManual)
			Library.updateCatalogue();
		else
			Downloader.cleanUp();
	}

	inline function getPluginLocation(type)
	{
		switch (Engine.getOS())
		{
			case "OSX":
				local library = FileSystem.getFolder(FileSystem.UserHome).getChildFile("Library");

				if (type == 1)
					return library.createDirectory("Audio/Plug-ins/Components");
				else
					return library.createDirectory("Audio/Plug-ins/VST3");

			case "LINUX":
				return FileSystem.fromAbsolutePath("~/.vst3");

			case "WIN":
				return FileSystem.fromAbsolutePath("C:/Program Files/Common Files/VST3");
		}
			
		return undefined;
	}

	inline function uninstall(projectName, removePresets)
	{
		deletePluginFiles(projectName);
		uninstallData(projectName, removePresets);
		Library.removeManifestEntry(projectName);
		Library.updateCatalogue();
	}

	inline function deletePluginFiles(projectName)
	{
		local filePaths = Library.getManifestValue(projectName, "files");

		if (!isDefined(filePaths))
			return;

		for (fp in filePaths)
		{
			local f = FileSystem.fromAbsolutePath(fp);
			local ext = f.toString(f.Extension);

			if (!isDefined(f) || (ext != ".vst3" && ext != ".component"))
				continue;

			f.deleteFileOrDirectory();
		}
	}

	inline function uninstallData(projectName, removePresets)
	{
		local rootDir = getAppDataDirectory(projectName);
		local name = projectName.toLowerCase();

		if (!isDefined(rootDir) || !rootDir.isDirectory() || rootDir.toString(rootDir.NoExtension).toLowerCase() != name)
			return;

		if (removePresets)
			return rootDir.deleteFileOrDirectory();
			
		local files = FileSystem.findFiles(rootDir, "*", false);
		
		for (x in files)
		{
			local filename = x.toString(x.Filename);

			if (["UserPresets", "User Presets"].contains(filename))
				continue;

			x.deleteFileOrDirectory();
		}
	}
	
	inline function load(projectName)
	{
		Engine.showMessageBox("Load Plugin", projectName + " can't run inside Rhapsody. It needs to be loaded directly within a DAW or plugin host.", 0);
	}
	
	inline function getAppDataDirectory(projectName)
	{
		return FileSystem.getFolder(FileSystem.AppData).getParentDirectory().createDirectory(projectName);
	}
	
	inline function getImageDirectory(projectName)
	{		
		return getAppDataDirectory(projectName).createDirectory("Images");
	}
	
	inline function getImagePath(projectName, imageName)
	{
		local img = getImageDirectory(projectName).getChildFile(imageName + ".png");
		
		if (isDefined(img) && img.isFile())
			return img.toString(img.FullPath);
		
		return undefined;
	}
}