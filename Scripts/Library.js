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

namespace Library
{
	const appData = FileSystem.getFolder(FileSystem.AppData);
	
	reg cache = appData.createDirectory("cache");
	
	// cmbAdd
	const cmbAdd = Content.getComponent("cmbAdd");
	cmbAdd.setControlCallback(oncmbAddControl);

	inline function oncmbAddControl(component, value)
	{
		switch (value)
		{
			case 1:
				Expansions.install();
				break;

			case 2:
				LicenseHandler.show();
				break;
		}		

		Grid.deselectAll();
		component.setValue(-1);
	}
	
	const lafcmbAdd = Content.createLocalLookAndFeel();
	cmbAdd.setLocalLookAndFeel(lafcmbAdd);
	
	lafcmbAdd.registerFunction("drawComboBox", function(g, obj)
	{
		var a = obj.area;
		var down = obj.down || obj.value;

		g.setColour(Colours.withAlpha(obj.bgColour, obj.hover && obj.enabled ? 0.7 + 0.3 * down: 0.9 - (0.3 * !obj.enabled)));
		g.fillRoundedRectangle(a, 2);

		g.setColour(Colours.withAlpha(Colours.black, obj.enabled ? 1.0 : 0.6));
		g.drawRoundedRectangle([a[0] + 0.5, a[1] + 0.5, a[2] - 1, a[3] - 1], 2, 1);
		
		var wh = a[3] / 2;
		g.setColour(Colours.withAlpha(obj.itemColour1, obj.hover && obj.enabled ? 0.8 + 0.2 * down: 0.9 - (0.3 * !obj.enabled)));
		g.fillPath(Paths.icons.add, [a[0] + a[2] / 2 - wh / 2, a[1] + a[3] / 2 - wh / 2, wh, wh]);  		
	});	
	
	lafcmbAdd.registerFunction("drawPopupMenuBackground", function(g, obj)
	{
		LookAndFeel.drawPopupMenuBackground(); 
	});
	
	lafcmbAdd.registerFunction("drawPopupMenuItem", function(g, obj)
	{
		LookAndFeel.drawPopupMenuItem();
	});

	lafcmbAdd.registerFunction("getIdealPopupMenuItemSize", function(obj)
	{
		return [200, 30];
	});
	
	App.broadcasters.isDownloading.addListener(cmbAdd, "Disable the add combo box while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});

	// btnSync
	const btnSync = Content.getComponent("btnSync");
	btnSync.set("enabled", true);
	btnSync.setLocalLookAndFeel(LookAndFeel.filledIconButton);
	btnSync.setControlCallback(onbtnSyncControl);

	inline function onbtnSyncControl(component, value)
	{
		if (value)
			return;

		if (!Account.isLoggedIn())
			return Engine.showMessageBox("Login Required", "Please login to sync your account.", 0);
			
		if (!Server.isOnline())
			return Engine.showMessageBox("Offline", "An internet connection is required.", 0);
	
		if (cooldownTimer.isTimerRunning())
			return Engine.showMessageBox("Cool Down", "Please wait a few seconds before syncing again.", 0);

		if (Content.isCtrlDown())
			clearCache();
			
		updateCache();
		Expansions.refresh();
		UpdateChecker.checkForAppUpdate();
	}	
	
	App.broadcasters.isDownloading.addListener(btnSync, "Disable sync button while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});

	// Cooldown Timer
	const cooldownTimer = Engine.createTimerObject();
	
	cooldownTimer.setTimerCallback(function()
	{
		btnSync.set("enabled", true);
		this.stopTimer();
	});

	inline function autoSync()
	{
		if (!Server.isOnline() || cooldownTimer.isTimerRunning())
			return;

		local lastSync = UserSettings.getProperty(Engine.getName(), "lastSync");
		local now = Date.getSystemTimeMs();

		if ((now - lastSync) / 86400000 > 1)
			updateCache();
	}

	inline function updateCatalogue()
	{
		local items = [];

		local installedExpansions = Expansions.getInstalledExpansionsData();

		for (expName in installedExpansions)
			items.push(installedExpansions[expName]);		

		local f = cache.getChildFile("cache.json");
		local cacheData;
		
		if (isDefined(f) && f.isFile())
			cacheData = f.loadEncryptedObject(App.systemId);

		if (!isDefined(cacheData) || !Account.isLoggedIn() || !Server.isOnline())
			return Grid.update(items);

		for (x in cacheData)
		{
			if (!isDefined(x.format) || x.format != "expansion") continue;
			if (!isDefined(x.hasLicense) || !x.hasLicense) continue;

			if (!isDefined(x.tags) || x.tags == "")
				x.tags = [];

			x.tags.push("licensed");

			if (!isDefined(installedExpansions[x.projectName]))
			{
				items.push(x);
				continue;
			}

			local e = installedExpansions[x.projectName];
			local index = items.indexOf(e);
			local item = items[index];

			for (property in x)
			{
				if (property == "tags")
				{
					mergeTags(item, x);
					continue;
				}

				item[property] = x[property];
			}

			if (item.latestVersion > item.installedVersion)
				item.hasUpdate = true;
		}

		Grid.update(items);
		ActionBar.hideAll();
	}

	inline function mergeTags(obj1, obj2)	
	{
		if (!isDefined(obj2["tags"]) || !Array.isArray(obj2["tags"]))
			return;	

		if (!isDefined(obj1["tags"]))
			return obj1["tags"] = obj2["tags"];

		for (t in obj2["tags"])
			obj1["tags"].pushIfNotAlreadyThere(t);
	}

	inline function clearCache()
	{
		if (isDefined(cache) && cache.isDirectory())
			cache.deleteFileOrDirectory();

		Server.cleanFinishedDownloads();
		cache = appData.createDirectory("cache");
	}

	inline function updateCache()
	{
		local token = Account.readToken();
		
		if (!isDefined(token) || !Server.isOnline())
			return;

		local endpoint = App.apiPrefix + "get_catalogue/";
		local headers = ["Authorization: Bearer " + token];
		local p = {};

		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.setHttpHeader(headers.join("\n"));
		
		Spinner.show("Syncing with Server");

		Server.callWithGET(endpoint, p, function(status, response)
		{
			if (status == 200 && typeof response == "object" && response.length > 0)
			{
				var f = cache.getChildFile("cache.json");
				f.writeEncryptedObject(response, App.systemId);

				updateCatalogue();

				var imageUrls = getImageUrls(response);
				downloadImages(imageUrls);
				
				btnSync.set("enabled", false);
				cooldownTimer.startTimer(5000);
				UserSettings.setProperty(Engine.getName(), "lastSync", Date.getSystemTimeMs());
			}
			else
			{
				if (isDefined(response.message))
					Engine.showMessageBox("Error", response.message, 3);
				else
					Engine.showMessageBox("Error", "The server reported an error, please try again later or contact support.", 3);

				if (isDefined(response.message) && response.message.contains("You are not currently logged in"))
					Account.autoLogout();
			}
			
			Spinner.hide();
		});
	}
	
	inline function getCachedImageNames()
	{
		local result = [];	
		local files = FileSystem.findFiles(cache, "*.jpg", false);

		for (x in files)
			result.push(x.toString(x.NoExtension));
	
		return result;
	}
	
	inline function getImageUrls(data)
	{
		local result = [];
		local cachedImages = getCachedImageNames();
		
		for (x in data)
		{
			if (!isDefined(x.projectName))
				continue;

			if (cachedImages.contains(x.projectName))
				continue;

			if (isDefined(x.image))
				result.push({"projectName": x.projectName, "url": x.image.replace(".b-cdn.net", ".com")});
		}

		return result;		
	}
	
	inline function downloadImages(urls)
	{
		Server.cleanFinishedDownloads();
		Server.setBaseURL(App.baseUrl[App.mode]);

		local completed = [];
		local total = urls.length;

		for (x in urls)
		{
			local projectName = x.projectName;
			local url = x.url.replace(App.baseUrl[App.mode], "");
			local f = cache.getChildFile(projectName + ".jpg");

			Server.downloadFile(url, {}, f, function[total, projectName, completed]()
			{
				Spinner.show("Downloading Images");

				if (this.data.finished)
				{
					completed.pushIfNotAlreadyThere(projectName);

					if (this.data.success)
						Grid.updateImage(projectName);
					else
						Console.print("Failed to download image for " + projectName);
				}
				
				if (completed.length >= total)
					Spinner.hide();
			});
		}
	}

	// Listeners	
	App.broadcasters.loginChanged.addListener("Library login", "Respond to login changes", function(state)
	{
		clearCache();

		if (state)
			updateCache();
		else
			updateCatalogue();	
	});
	
	// Calls	
	updateCatalogue();
	autoSync();
}