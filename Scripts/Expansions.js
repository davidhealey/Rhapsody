/*
    Copyright 2022, 2023 David Healey

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

namespace Expansions
{
	const appData = FileSystem.getFolder(FileSystem.AppData);	
	const expHandler = Engine.createExpansionHandler();

	reg extractionCount;
	reg numZips;
	reg callback;
	reg abort;
	reg isManual = false;

	inline function install()
	{
		isManual = true;

		local lastLwzPath = UserSettings.getProperty(Engine.getName().toLowerCase(), "lastLwzPath");
		local startFolder = FileSystem.getFolder(FileSystem.Downloads);
	
		if (isDefined(lastLwzPath) && lastLwzPath != "")
			startFolder = FileSystem.fromAbsolutePath(lastLwzPath);
	
		FilePicker.show({
			startFolder: startFolder,
			mode: 0,
			filter: "*.lwz",
			title: "Installer",
			icon: ["hdd", 60, 60],
			message: "Select one of the lwz files you downloaded.",
			buttonText: "Ok",
			hideOnSubmit: false,
			}, selectZipCallback);		
	}
	
	inline function selectZipCallback(f)
	{		
		local numExpansionsInDir = getNumExpansionsInDirectory(f.getParentDirectory());
	
		UserSettings.setProperty(Engine.getName().toLowerCase(), "lastLwzPath", f.getParentDirectory().toString(f.FullPath));

		if (numExpansionsInDir == 1)
			return singleInstall(f);

		Engine.showYesNoWindow("Batch Install", "Would you like to install all instruments in the selected folder at once?", function[f](response)
		{
			if (response)
				batchInstall(f.getParentDirectory());
			else
				singleInstall(f);
		});
	};
	
	inline function askForSampleDirectory(data, callback)
	{
		local defaultSamplePath = UserSettings.getProperty(Engine.getName().toLowerCase(), "defaultSamplePath");
		local startFolder = FileSystem.getFolder(FileSystem.Desktop);
	
		if (isDefined(defaultSamplePath) && defaultSamplePath != "")
			startFolder = FileSystem.fromAbsolutePath(defaultSamplePath);
				
		FilePicker.show({
			startFolder: startFolder,
			mode: 1,
			filter: "",
			title: "Install Instrument",
			icon: ["hdd", 60, 60],
			message: "Choose a location to install the samples.",
			buttonText: "Install"
		}, function[callback, data](dir) {

			if (!dir.hasWriteAccess())
				return Engine.showMessageBox("Unwritable Directory", "You do not have write permission for the selected directory. Please choose a different one.", 1);
				
			if (isDefined(dir) && dir.isDirectory())		
				UserSettings.setProperty(Engine.getName().toLowerCase(), "defaultSamplePath", dir.toString(dir.FullPath));
		
			callback(data, dir);
		});
	}
	
	inline function singleInstall(f)
	{
		local filename = f.toString(f.NoExtension);
		local expName = getExpansionNameFromFilename(filename);
		
		if (expName == "")
		{
			FilePicker.hide();
			return Engine.showMessageBox("Invalid File", "The filename is not in the correct format.", 1);
		}	

		local hasSamples = FileSystem.findFiles(f.getParentDirectory(), expName.toLowerCase().replace(" ", "_") + "*_samples_*", false).length > 0;
		local archives = getZipFilesForProduct(f.getParentDirectory(), expName);
		local e = expHandler.getExpansion(expName);
		
		if (!hasSamples || isDefined(e))
		{
			unpackArchives(archives, "", -1);
		}			
		else
		{
			askForSampleDirectory(archives, function(data, dir)
			{						
				unpackArchives(data, dir, -1);
			});
		}
	}	

	inline function getZipFilesForProduct(dir, expansionName)
	{
		local formattedName = expansionName.toLowerCase().replace(" ", "_");
		local result = FileSystem.findFiles(dir, formattedName + "*.lwz", false);
		return result;
	}	

	inline function getNumExpansionsInDirectory(dir)
	{
		local files = FileSystem.findFiles(dir, "*.lwz", false);
		local expansionNames = [];
		
		for (x in files)
		{
			local expName = getExpansionNameFromFilename(x.toString(x.Filename));
			expansionNames.pushIfNotAlreadyThere(expName);
		}

		return expansionNames.length;
	}

	inline function automatedInstall(data)
	{
		isManual = false;

		local fileDir = data.tempDir;
		local sampleDir = data.sampleDir;
		local files = FileSystem.findFiles(fileDir, "*.lwz", false);
		
		if (!files.length)
			return Console.print("Something has gone wrong!!");

		unpackArchives(files, sampleDir, data.bcProgress);
	}

	inline function unpackArchives(archives, defaultSampleDir, broadcaster)
	{
		numZips = archives.length;
		abort = false;
		extractionCount = 0;
	
		FilePicker.hide();
	
		Engine.sortWithFunction(archives, sortFiles);
		
		if (isManual)
			Spinner.show("Installing");
		
		for (x in archives)
		{
			local filename = x.toString(x.Filename);
			local expName = getExpansionNameFromFilename(filename);
			local e = expHandler.getExpansion(expName);
			local sampleDir = defaultSampleDir;
			local dataDir = getDataDirectory(expName);

			if (isDefined(e))
			{
				sampleDir = e.getSampleFolder();

				if (!sampleDir.isDirectory())
					sampleDir.createDirectory(sampleDir.toString(sampleDir.FullPath));
					
				if (!isManual)
					e.unloadExpansion();
			}

			if (isDefined(sampleDir) && sampleDir != "")
			{
				if (sampleDir.toString(sampleDir.NoExtension) != expName)
					sampleDir = sampleDir.createDirectory(expName);
		
				createLinkFile(expName, sampleDir);
			}				

			local targetDir;

			if (filename.contains("_data_"))
				targetDir = dataDir;
			else if (filename.contains("_samples_"))
			{
				targetDir = sampleDir;
			}

			if (!isDefined(targetDir) || !targetDir.isDirectory() || targetDir == "")
			{
				numZips--;
				continue;
			}

			if (abort)
				return;

			x.extractZipFile(targetDir, true, function[broadcaster](obj)
			{
				extractionCallback(obj, broadcaster);
			});			
		}
	}
	
	inline function extractionCallback(obj, broadcaster)
	{
		obj.Cancel = (obj.Error != "" || abort);

		if (isDefined(broadcaster) && broadcaster != -1)
			broadcaster.progress = {value: Math.round(obj.Progress * 100), message: "Installing: " + (extractionCount + 1) + "/" + numZips};
	
		if (obj.Status != 2)
			return;

		extractionCount++;
		
		if (extractionCount < numZips)
			return;

		refresh();

		if (!isManual)
			Downloader.cleanUp();
		else
			Library.updateCatalogue();
		
		isManual = false;
		Spinner.hide();
	}

	inline function getRhapsodyExpansionsDirectory()
	{
		return appData.getParentDirectory().createDirectory("Rhapsody").createDirectory("Expansions");
	}

	inline function createLinkFile(expName, target)
	{
		local linkFile;
	
		switch (Engine.getOS())
		{
			case "OSX": linkFile = "LinkOSX"; break;
			case "LINUX": linkFile = "LinkLinux"; break;
			case "WIN": linkFile = "LinkWindows"; break;
		}
	
		local f = getRhapsodyExpansionsDirectory().createDirectory(expName).createDirectory("Samples").getChildFile(linkFile);

		if (isDefined(f) && isDefined(target) && target.isDirectory())
			f.writeString(target.toString(f.FullPath));
	}

	inline function getDataDirectory(expName)
	{
		return getRhapsodyExpansionsDirectory().createDirectory(expName);
	}
		
	inline function getExpansionNameFromFilename(filename)
	{
		local matches = Engine.getRegexMatches(filename, ".+data|.+samples");
		
		if (isDefined(matches))
			return matches[0].replace("_data").replace("_samples").replace("_", " ").trim().capitalize();
	
		return "";
	}	

	inline function refresh()
	{
		expHandler.refreshExpansions();

		for (e in expHandler.getExpansionList())
			e.rebuildUserPresets();		
	}
		
	inline function getInstalledExpansionsData()
	{
		local result = {};
			
		for (e in expHandler.getExpansionList())
		{
			local props = e.getProperties();

			local obj = {
				"name": props.Name,
				"projectName": props.ProjectName,
				"tags": props.Tags.replace(", ", ",").split(","),
				"company": props.Company,
				"format": "expansion",
				"installedVersion": props.Version,
				"sampleDir": e.getSampleFolder(),
				"uuid": props.UUID
			};

			if (!isDefined(obj.tags))
				obj.tags= [];

			obj.tags.push("installed");

			result[props.ProjectName] = obj;
		}
	
		return result;
	}
	
	inline function getInstalledVersion(expName)
	{
		local e = expHandler.getExpansion(expName);
		
		if (!isDefined(e))
			return undefined;
			
		return e.getProperties().Version;
	}
	
	inline function uninstall(data, removePresets)
	{
		local e = expHandler.getExpansion(data.projectName);

		if (!isDefined(e))
			return Engine.showMessageBox("Failed", "The library was not found on your system.", 3);

		uninstallData(e, removePresets);
		uninstallSamples(e, data);
	}
	
	inline function uninstallData(expansion, removePresets)
	{
		local rootDir = expansion.getRootFolder();
		local name = expansion.getProperties().Name;
		
		if (!isDefined(rootDir) || !rootDir.isDirectory() || rootDir.toString(rootDir.NoExtension) != name)
			return;

		if (removePresets)
			return rootDir.deleteFileOrDirectory();

		local files = FileSystem.findFiles(rootDir, "*", false);
		
		for (x in files)
		{
			local filename = x.toString(x.Filename);
			
			if (filename == "UserPresets") continue;			
			x.deleteFileOrDirectory();
		}
	}
	
	inline function uninstallSamples(expansion, data)
	{
		local sampleDir = expansion.getSampleFolder();
		local name = expansion.getProperties().Name;
		
		if (!isDefined(sampleDir) || !sampleDir.isDirectory() || sampleDir.toString(sampleDir.NoExtension) != name)
			return uninstallCleanUp(expansion, data);
	
		local files = FileSystem.findFiles(sampleDir, "*", false);
		
		for (x in files)
		{
			local extension = x.toString(x.Extension).toLowerCase();
			
			if (!extension.contains(".ch") && extension != ".wav") continue;
	
			x.deleteFileOrDirectory();
		}
		
		files = FileSystem.findFiles(sampleDir, "*", false);
	
		if (!files.length)
			sampleDir.deleteFileOrDirectory();
	
		uninstallCleanUp(expansion, data);
	}
	
	inline function uninstallCleanUp(expansion, data)
	{
		expansion.unloadExpansion();
		refresh();

		Library.updateCatalogue();
	}

	inline function edit(projectName)
	{
		local e = expHandler.getExpansion(projectName);

		if (!isDefined(e))
			return Engine.showMessageBox("Failed", "The library was not found on your system.", 3);

		local name = e.getProperties().Name;
		local sampleDir = e.getSampleFolder();

		if (!isDefined(sampleDir) || !sampleDir.isDirectory())
			sampleDir = FileSystem.getFolder(FileSystem.Desktop);

		FilePicker.show({
			startFolder: sampleDir,
			mode: 1,
			filter: "",
			title: "Locate Samples",
			icon: ["hdd", 60, 60],
			message: "Select the folder containing the .ch sample files for " + name,
			buttonText: "Ok",
			hideOnSubmit: true,
			}, function[e](dir) {
				relocateSamples(e, dir);
			});
	}
	
	inline function relocateSamples(e, dir)
	{
		if (!isDefined(dir) || !dir.isDirectory())
			return;

		local files = FileSystem.findFiles(dir, "*.ch1", false);

		if ((files.length > 0 && e.setSampleFolder(dir)) || dir.isSameFileAs(e.getSampleFolder()))
		{
			Engine.showMessageBox("Success", "The sample folder was relocated. Please restart Rhapsody.", 0);
			Engine.reloadAllSamples();
		}
		else
		{
			if (files.length > 0)
				Engine.showMessageBox("Failed", "The selected folder could not be used.", 3);
			else
				Engine.showMessageBox("Failed", "The selected folder does not contain all the samples.", 3);						
		}
	}

	inline function getImagePath(expName, imgName)
	{
		local e = expHandler.getExpansion(expName);

		if (isDefined(e))
		{
			if (imgName == "Icon")
				return e.getWildcardReference(imgName + ".png");

			if (imgName == "thumbnail")
			{
				local rootDir = e.getRootFolder();
				local f = rootDir.getChildFile(imgName + ".png");

				if (isDefined(f) && f.isFile())
					return f.toString(f.FullPath);
			}
		}

		return undefined;
	}
	
	inline function sortFiles(a, b)
	{
		if (a.toString(a.Filename) < b.toString(b.Filename))
			return -1;
		else
			return a.toString(a.Filename) > b.toString(b.Filename);
	}
	
	inline function getExpansion(expName)
	{
		return expHandler.getExpansion(expName);
	}
	
	inline function abortInstallation()
	{
		abort = true;
	}
	
	inline function setCurrent(expName)
	{
		expHandler.setCurrentExpansion(expName);
	}
}