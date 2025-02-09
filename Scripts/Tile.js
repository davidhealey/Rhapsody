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

namespace Tile
{
	inline function create(panel, area, data, isOnline)
	{
		local cp = panel.addChildPanel();
		
		cp.setPosition(area[0], area[1], area[2], area[3]);
		cp.set("text", data.projectName);
		cp.set("tooltip", data.shortDescription || "");			
		cp.set("allowCallbacks", "All Callbacks");

		for (x in data)
			cp.data[x] = data[x];
				
		cp.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
			var image = this.get("text");
			var imageSize = this.getImageSize(image);
			
			g.setColour(Colours.withAlpha(0xff1d1d21, this.data.hover ? 0.8 : 1.0));
			g.fillRoundedRectangle([a[0], a[1], a[2], a[3]], 5);

			if (!isDefined(this.data.progress))
			{
				if (isDefined(this.data.hasLicense) && !isDefined(this.data.installedVersion))
					g.setColour(Colours.withAlpha(Colours.white, 0.3));
				else
					g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 0.9 + 0.1 * this.getValue() : 1.0));
			}

			if (this.isImageLoaded(image) && imageSize[0] == imageSize[1])
				g.drawImage(image, [0, 0, a[2], a[3]], 0, 0);
			else
				drawPlaceholderImage();

			g.setFont("regular", 18);

			g.setColour(Colours.withAlpha(0xffa8b2bd, this.data.hover ? 0.9 : 1.0));
			
			var textWidth = a[2] - 30 - (30 * (isDefined(this.data.hasUpdate) && this.data.hasUpdate)) - (12 * (this.data.hasLicense && !isDefined(this.data.installedVersion)));

			g.drawFittedText(this.data.name, [a[0] + 10, a[3] - 40, textWidth, 41], "left", 1, 1);

			if (isDefined(this.data.progress))
				drawProgressIndicator(a, this.data.progress);	
		});

		cp.setMouseCallback(function(event)
		{
			if (!isDefined(this.data) || !isDefined(this.data.installedVersion))
				return;

			var a = this.getLocalBounds(0);

			this.setMouseCursor(event.hover && event.y < (a[3] - 40) ? "PointingHandCursor" : "NormalCursor", Colours.white, [0, 0]);
			this.data.hover = event.hover && this.get("enabled") && event.y < (a[3] - 40);

			if (event.y > (a[3] - 40))
				return this.repaint();

			this.repaint();

			if (event.clicked && !event.rightClick)
			{
				if (Engine.isHISE())
					return Console.print(this.data.name);
				
				if (this.data.format == "expansion")
					Expansions.setCurrent(this.data.projectName);
				else
					Plugins.load(this.data.projectName);
			}
		});

		App.broadcasters.isDownloading.addListener(cp, "Disable the panel while downloads are in progress", function(state)
		{
			this.set("enabled", !state);
			this.repaint();
		});

		addListeners(cp);
		addButtons(cp, isOnline);

		return cp;
	}
		
	inline function addButtons(cp, isOnline)
	{
		local data = cp.data;
		local isInstalled = isDefined(data.installedVersion) && data.installedVersion > 0;

		if (isInstalled)
			data.btnEdit = createEditMenu(cp);

		if (!isOnline)
			return;

		if ((!isDefined(data.hasLicense) || !data.hasLicense ) && !isInstalled && isDefined(data.url) && data.regularPrice != "0")
			return createBuyButton(cp);

		if ((!isDefined(data.hasLicense) || !data.hasLicense) && data.regularPrice != "0")
			return;

		if (!isInstalled)
			data.btnInstall = createInstallButton(cp, "Install");
		else if (isInstalled && isDefined(data.hasUpdate) && data.hasUpdate)
			data.btnInstall = createInstallButton(cp, "Update");
			
		if (!isInstalled || (isDefined(data.hasUpdate) && data.hasUpdate))
			data.btnAbort = createAbortButton(cp);
	}

	inline function createEditMenu(parent)
	{
		local area = parent.getLocalBounds(0);
		local data = parent.data;
		local b = parent.addChildPanel();

		local menuItems = [];

		if (data.format == "expansion")
			menuItems = ["Add to Favourites", "Locate Samples"];

		if (isDefined(data.favourite) && data.favourite)
			menuItems[0] = "Remove Favourite";

		if (isDefined(data.url) && data.url != "")
			menuItems.push("Visit Webpage");
			
		menuItems.push("Uninstall");

		b.setPosition(area[2] - 17, area[3] - 28, 8, 16);
		b.set("itemColour", 0xffa8b2bd);
		b.set("allowCallbacks", "All Callbacks");
		b.set("popupMenuItems", menuItems.join("\n"));
		b.set("popupMenuAlign", true);
		b.set("popupOnRightClick", false);
		b.setControlCallback(oncmbEditControl);
		b.data.icon = "ellipsisVertical";

		b.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);

			if (this.get("enabled"))
				g.setColour(Colours.withAlpha(this.get("itemColour"), this.data.hover ? 1.0 : 0.8));
			else
				g.setColour(Colours.withAlpha(this.get("itemColour"), 0.2));

			g.fillPath(Paths.icons[this.data.icon], [a[0] + a[2] / 4, a[1], a[2] / 2, a[3]]);
		});

		b.setMouseCallback(function(event)
		{
			this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
			this.data.hover = event.hover;

			if (isDefined(event.result))
			{
				this.setValue(event.result);
				this.changed();
			}

			this.repaint();
		});

		App.broadcasters.isDownloading.addListener(b, "Disable the edit menu while downloads are in progress", function(state)
		{
			this.set("enabled", !state);
			this.repaint();
		});

		return b;
	}

	inline function createBuyButton(parent)
	{
		local area = parent.getLocalBounds(0);
		local b = parent.addChildPanel();
	
		b.setPosition(area[2] - 28, area[3] - 27, 16, 16);	
		b.set("tooltip", type + " " + parent.get("text") + ".");
		b.set("itemColour", 0xffa8b2bd);
		b.set("allowCallbacks", "Clicks & Hover");
		b.data.icon = Paths.icons.openInNew;
		b.data.url = parent.data.url;
	
		b.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
	
			if (this.get("enabled"))
				g.setColour(Colours.withAlpha(this.get("itemColour"), this.data.hover ? 1.0 - 0.3 * this.getValue() : 0.8));
			else
				g.setColour(Colours.withAlpha(this.get("itemColour"), 0.2));
	
			g.fillPath(this.data.icon, a);
		});
	
		b.setMouseCallback(function(event)
		{
			this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
			this.setValue(event.clicked);
			this.data.hover = event.hover;
			this.repaint();
	
			if (event.mouseUp)
				Engine.openWebsite(this.data.url);
		});
	
		return b;		
	}

	inline function createInstallButton(parent, type)
	{
		local area = parent.getLocalBounds(0);
		local b = parent.addChildPanel();

		if (type == "Install")
			b.setPosition(area[2] - 30, area[3] - 29, 18, 18);
		else
			b.setPosition(area[2] - 45, area[3] - 29, 18, 18);

		b.set("tooltip", type + " " + parent.get("text") + ".");
		b.set("itemColour", 0xff7fff74);
		b.set("allowCallbacks", "Clicks & Hover");
		b.setControlCallback(onbtnInstallControl);
		b.data.icon = type == "Install" ? Paths.icons.download : Paths.icons.update;

		b.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
	
			if (this.get("enabled"))
				g.setColour(Colours.withAlpha(this.get("itemColour"), this.data.hover ? 1.0 - 0.3 * this.getValue() : 0.8));
			else
				g.setColour(Colours.withAlpha(this.get("itemColour"), 0.2));

			g.fillPath(this.data.icon, a);
		});

		b.setMouseCallback(function(event)
		{
			this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
			this.setValue(event.clicked);
			this.data.hover = event.hover;
			this.repaint();
	
			if (event.mouseUp)
				this.changed();
		});
		
		parent.data.bcIsDownloading.addListener(b, "Hide the install/update button while downloading", function(state)
		{
			this.showControl(!state);
			this.repaint();
		});

		return b;		
	}
	
	inline function createAbortButton(parent)
	{	
		local area = parent.getLocalBounds(0);	
		local b = parent.addChildPanel();

		b.setPosition(area[2] - 25, area[1] + 10, 14, 14);
		b.set("allowCallbacks", "Clicks & Hover");
		b.set("itemColour", Colours.white);
		b.data.icon = "x";
		b.showControl(false);
		b.setControlCallback(onbtnAbortControl);
			
		b.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
	
			g.setColour(Colours.black);
			g.drawPath(Paths.icons[this.data.icon], a, 2);
	
			g.setColour(Colours.withAlpha(this.get("itemColour"), this.data.hover ? 0.8 + 0.2 * this.getValue() : 0.9));
			g.fillPath(Paths.icons[this.data.icon], a);
		});
			
		b.setMouseCallback(function(event)
		{
			this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
			this.setValue(event.clicked);
			this.data.hover = event.hover;
			this.repaint();
	
			if (event.mouseUp)
				this.changed();
		});

		parent.data.bcIsDownloading.addListener(b, "Show abort button during download", function(state)
		{
			this.showControl(state);
			this.repaint();
		});
	
		return b;
	}

	inline function drawPlaceholderImage()
	{
		local h = (a[3] - 40);

		g.setColour(0x882F2F34);
		g.fillRoundedRectangle([a[0], a[1], a[2], h], {CornerSize: 5, Rounded:[1, 1, 0, 0]});

		g.setColour(0xffe2e2e2);
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[0] + a[2] / 2 - a[2] / 5 / 2, a[1] + h / 2 - a[2] / 5 / 2, a[2] / 5, a[2] / 5]);
	}
	
	inline function drawProgressIndicator(a, progress)
	{
		local v = progress.value / 100;
		local diameter = a[3] / 1.4;
		local arcArea = [a[2] / 2 - diameter / 2, a[3] / 2 - diameter / 2 - 10, diameter, diameter];
		local path = Content.createPath(a[2]);
		local arcThickness = 0.05;
		local startOffset = 3.15;
		local endOffset = -startOffset + 2.0 * startOffset * v;

		g.setColour(Colours.withAlpha(Colours.black, 0.8));
		g.fillRoundedRectangle(a, 2);

		g.setColour(Colours.withAlpha(Colours.darkgrey, 0.6));
		g.drawEllipse(arcArea, 13);

	    g.setColour(Colours.withAlpha(0xffc8d4e2, 1.0));

	    endOffset = Math.max(endOffset, -startOffset + 0.01);
	    path.addArc(arcArea, -startOffset, endOffset);

	    g.drawPath(path, 0, a[2] * arcThickness);

		g.setColour(Colours.white);
		g.setFont("bold", 30);
	    g.drawAlignedText(progress.value + "%", [a[0], a[1] + 60, a[2], 25], "centred");

		g.setFont("semibold", 18);
		g.drawAlignedText(progress.message, [a[0], a[1] - 5, a[2], a[3] - 10], "centred");

		if (isDefined(progress.speed))
		{
			g.setFont("medium", 18);
			g.drawAlignedText(progress.speed, [a[0], a[3] - 110, a[2], 25], "centred");
		}
	}
	
	inline function oncmbEditControl(component, value)
	{
		local parent = component.getParentPanel();
		local data = parent.data;
		local items = component.get("popupMenuItems").split("\n");

		switch (items[value - 1])
		{
			case "Add to Favourites":
			case "Remove Favourite":
				data.favourite = Library.toggleFavourite(data.projectName);
				removeButtons(parent);
				addButtons(parent, true);

				if (!data.favourite)
					Grid.filterTiles();
				break;

			case "Locate Samples":
				Expansions.edit(data.projectName);
				break;

			case "Uninstall":
				uninstall(data);
				break;

			case "Visit Webpage":
				Engine.openWebsite(data.url);
				break;
		}
	}

	inline function onbtnInstallControl(component, value)
	{
		if (value)
			return;

		local data = component.getParentPanel().data;

		if (Engine.isPlugin() && Engine.getOS() == "WIN" && data.format == "plugin")
			return Engine.showMessageBox("Permission Required", "Please use the standalone version of Rhapsody to install " + data.name, "0");
			
		if ((isDefined(data.sampleDir) && data.sampleDir.isDirectory()) || data.format == "plugin")
			Downloader.addToQueue(data);
		else
			promptForSampleDirectory(data);
	}

	inline function onbtnAbortControl(component, value)
	{
		local data = component.getParentPanel().data;

		Engine.showYesNoWindow("Cancel", "Do you want to cancel the download and installation?", function[data](response)
		{
			if (!response)
				return;
			
			Downloader.abortDownloads(data);
			Expansions.abortInstallation();
		});
	}
	
	inline function uninstall(data)
	{
		Engine.showYesNoWindow("Uninstall", "Are you sure you want to remove " + data.name + "?", function[data](response1)
		{
			if (response1)
			{
				Engine.showYesNoWindow("Uninstall Presets", "Do you want to remove your custom presets?", function[data](response2)
				{
					if (data.format == "expansion")
						Expansions.uninstall(data.projectName, response2);
					else
						Plugins.uninstall(data.projectName, response2);
				});
			}
		});
	}
	
	inline function promptForSampleDirectory(tileData)
	{	
		Expansions.askForSampleDirectory(tileData, function(data, dir)
		{
			data.sampleDir = dir;
			Downloader.addToQueue(data);
		});
	}
	
	inline function removeButtons(cp)
	{
		for (x in cp.getChildPanelList())
			x.removeFromParent();
	}

	inline function addListeners(cp)
	{
		local data = cp.data;
		local isInstalled = isDefined(data.installedVersion) && data.installedVersion > 0;

		if (data.regularPrice != "0")
			if (!data.hasLicense || (isInstalled && (!isDefined(data.hasUpdate) || !data.hasUpdate)))
				return;

		data.bcIsDownloading = Engine.createBroadcaster({"id": data.name + "Download State", "args": ["state"]});
		data.bcProgress = Engine.createBroadcaster({"id": data.name + "Download Progress", "args": ["progress"]});
	
		data.bcIsDownloading.addListener(cp, "Update panel when download state changes", function(state)
		{
			this.set("enabled", !state);
	
			if (!state)
			{
				removeButtons(this);
				addButtons(this, Server.isOnline());
			}

			this.repaint();
		});

		data.bcProgress.addListener(cp, "Update download progress", function(progress)
		{
			if (isDefined(progress.message) && progress.message.contains("Installing"))
				this.data.btnAbort.showControl(false);
	
			this.data.progress = progress == -1 ? undefined : progress;
			this.repaint();
		});
	}	
}