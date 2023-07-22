namespace ActionBar
{
	// pnlActionBar
	const pnlActionBar = Content.getComponent("pnlActionBar");	
		
	// btnLoad
	const btnLoad = Content.getComponent("btnLoad");
	btnLoad.set("enabled", true);
	btnLoad.setLocalLookAndFeel(LookAndFeel.textButton);
	btnLoad.setControlCallback(onbtnLoadControl);

	inline function onbtnLoadControl(component, value)
	{
		if (value)
			return;

		local cp = Grid.getSelected();

		if (!isDefined(cp) || cp == -1)
			return;
		
		Expansions.setCurrent(cp.data.projectName);
		hideAll();
	}
	
	App.broadcasters.isDownloading.addListener(btnLoad, "Disable the load button while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});

	// btnDownload
	const btnDownload = Content.getComponent("btnDownload");
	btnDownload.set("enabled", true);
	btnDownload.setLocalLookAndFeel(LookAndFeel.textButton);
	btnDownload.setControlCallback(onbtnDownloadControl);
	
	inline function onbtnDownloadControl(component, value)
	{
		if (value)
			return;

		local cp = Grid.getSelected();
		
		if (!isDefined(cp) || cp == -1)
			return;

		local data = cp.data;
				
		if (isDefined(data.sampleDir) && data.sampleDir.isDirectory())
			Downloader.addToQueue(data);
		else
			promptForSampleDirectory(data);
			
		Grid.deselectAll();			
		hideAll();
	}
	
	// btnRemove
	const btnRemove = Content.getComponent("btnRemove");
	btnRemove.set("enabled", true);
	btnRemove.setLocalLookAndFeel(LookAndFeel.textButton);
	btnRemove.setControlCallback(onbtnRemoveControl);
	
	inline function onbtnRemoveControl(component, value)
	{
		if (value)
			return;

		local cp = Grid.getSelected();

		if (!isDefined(cp) || cp == -1)
			return;

		local data = cp.data;
		
		Engine.showYesNoWindow("Uninstall", "Are you sure you want to remove " + data.name + "?", function[data](response1)
		{
			if (response1)
			{
				Engine.showYesNoWindow("Presets", "Do you want to remove your custom presets?", function[data](response2)
				{
					Expansions.uninstall(data, response2);
					Grid.deselectAll();
				});
			}
		});
	}
	
	App.broadcasters.isDownloading.addListener(btnRemove, "Disable the remove button while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});
	
	// btnEdit
	const btnEdit = Content.getComponent("btnEdit");
	btnEdit.set("enabled", true);
	btnEdit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnEdit.setControlCallback(onbtnEditControl);
	
	inline function onbtnEditControl(component, value)
	{
		if (value)
			return;

		local cp = Grid.getSelected();

		if (!isDefined(cp) || cp == -1)
			return;
		
		Expansions.edit(cp.data.projectName);
	}
	
	App.broadcasters.isDownloading.addListener(btnEdit, "Disable the edit button while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});
	
	// btnUpdate
	const btnUpdate = Content.getComponent("btnUpdate");
	btnUpdate.set("enabled", true);
	btnUpdate.setLocalLookAndFeel(LookAndFeel.textButton);
	btnUpdate.setControlCallback(onbtnUpdateControl);
	
	inline function onbtnUpdateControl(component, value)
	{
		if (value)
			return;

		local cp = Grid.getSelected();

		if (!isDefined(cp) || cp == -1)
			return;

		local data = cp.data;

		Engine.showYesNoWindow("Confirmation", "Do you want to update " + data.name + "?", function[data](response)
		{
			if (!response)
				return;

			if (isDefined(data.sampleDir) && data.sampleDir.isDirectory())
				Downloader.addToQueue(data);
			else
				promptForSampleDirectory(data);
				
			hideAll();
		});
	}
		
	// Functions	
	inline function show(data)
	{
		btnLoad.fadeComponent(isDefined(data.installedVersion), 100);
		btnRemove.fadeComponent(isDefined(data.installedVersion), 100);
		btnEdit.fadeComponent(isDefined(data.installedVersion), 100);
		btnUpdate.fadeComponent(isDefined(data.hasUpdate) && data.hasUpdate, 100);
		
		if (!isDefined(data.installedVersion) && isDefined(data.hasLicense) && data.hasLicense)
			btnDownload.fadeComponent(true, 100);
		else
			btnDownload.fadeComponent(false, 100);
	}

	inline function hideAll()
	{
		btnLoad.fadeComponent(false, 100);
		btnRemove.fadeComponent(false, 100);
		btnEdit.fadeComponent(false, 100);
		btnUpdate.fadeComponent(false, 100);
		btnDownload.fadeComponent(false, 100);
	}

	inline function promptForSampleDirectory(tileData)
	{	
		Expansions.askForSampleDirectory(tileData, function(data, dir)
		{
			data.sampleDir = dir;
			Downloader.addToQueue(data);
		});
	}
	
	hideAll();
}