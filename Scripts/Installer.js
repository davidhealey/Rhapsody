namespace Installer
{
	inline function install()
	{
		local lastLwzPath = UserSettings.getProperty(Engine.getName().toLowerCase(), "lastLwzPath");
		local startFolder = FileSystem.getFolder(FileSystem.Downloads);
	
		if (isDefined(lastLwzPath) && lastLwzPath != "")
			startFolder = FileSystem.fromAbsolutePath(lastLwzPath);

		FilePicker.show({
			startFolder: startFolder,
			mode: 0,
			filter: "*.lwz",
			title: "Installer",
			icon: ["hdd", 60, 42],
			message: "Select one of the lwz files you downloaded.",
			buttonText: "Ok",
			hideOnSubmit: false,
			}, selectZipCallback);
	}

	inline function selectZipCallback(file)
	{
		local filename = file.toString(file.Filename);
		local projectName = getProjectNameFromFilename(filename);
		
		UserSettings.setProperty(Engine.getName().toLowerCase(), "lastLwzPath", file.getParentDirectory().toString(file.FullPath));

		if (filename.contains("_plugin_"))
		{
			local fileOs = getOSFromFilename(filename);

			if (fileOs != Engine.getOS())
				return Engine.showMessageBox("Wrong OS", "The selected file is not for this operating system.", 1);

			Plugins.manualInstall(file, projectName);
		}			
		else
		{
			Expansions.manualInstall(file, projectName);
		}			
	}
	
	inline function getOSFromFilename(filename)
	{
		if (filename.contains("_linux_"))
			return "LINUX";
			
		if (filename.contains("_win_"))
			return "WIN";
			
		if (filename.contains("_osx_"))
			return "OSX";
			
		return "";
	}
	
	inline function getProjectNameFromFilename(filename)
	{
		local matches = Engine.getRegexMatches(filename, ".+data|.+samples|.+plugin");

		if (isDefined(matches))
			return matches[0].replace("_data").replace("_samples").replace("_plugin").replace("_", " ").trim().capitalize();
	
		return "";
	}
	
	inline function getVersionFromFilename(filename)
	{
		local version = Engine.getRegexMatches(filename, "\\d_\\d_\\d")[0];
		
		if (isDefined(version))
			return version.replace("_", ".");

		return -1;
	}
}