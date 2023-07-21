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
		cp.set("tooltip", data.shortDescription);
		cp.set("allowCallbacks", "All Callbacks");

		for (x in data)
			cp.data[x] = data[x];

		if (cp.data.hasLicense)
		{
			cp.data.bcIsDownloading = Engine.createBroadcaster({"id": "Download State", "args": ["state"]});
			cp.data.bcProgress = Engine.createBroadcaster({"id": "Download Progress", "args": ["progress"]});

			cp.data.bcIsDownloading.addListener(cp, "Disable panel during download", function(state)
			{
				this.set("enabled", !state);
				this.repaint();
			});

			cp.data.bcProgress.addListener(cp, "Update download progress", function(progress)
			{
				if (isDefined(progress.message) && progress.message.contains("Installing"))
					this.data.btnAbort.showControl(false);

				this.data.progress = progress == -1 ? undefined : progress;
				this.repaint();
			});
		}
		
		cp.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(2);

			g.setColour(Colours.withAlpha(0xff161619, this.data.hover ? 0.8 : 1.0));
			g.fillRoundedRectangle([a[0], a[1], a[2], a[3] - 25], {CornerSize: 2, Rounded:[0, 0, 1, 1]});

			if (!isDefined(this.data.progress))
				g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 0.9 + 0.1 * this.getValue() : 1.0));

			if (this.isImageLoaded(this.get("text")))
				g.drawImage(this.get("text"), [a[0] + 2, a[1] + 2, a[2] - 4, a[2] - 4], 0, 0);
			else
				drawPlaceholderImage();			

			g.setFont("semibold", Engine.getOS() == "WIN" ? 18 : 16);

			g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 0.9 : 1.0));
			g.drawFittedText(this.data.name, [a[0] + 10, a[2], a[2] - 20, 42], "centred", 1, 1);

			if (this.get("enabled"))
				drawHighlight();

			if (isDefined(this.data.progress))
				drawProgressIndicator(a, this.data.progress);				
		});
				
		cp.setMouseCallback(function(event)
		{
			if (!isDefined(this.data))
				return;

			var a = this.getLocalBounds(0);

			this.setMouseCursor(event.hover ? "PointingHandCursor" : "NormalCursor", Colours.white, [0, 0]);
			this.data.hover = event.hover && this.get("enabled");
			
			if (event.clicked)
				this.setValue(1);

			if (event.mouseUp)
				this.setValue(0);

			if (event.clicked && !event.rightClick)
				Grid.setSelected(this.data.projectName);

			this.repaint();
		});

		addAbortButton(cp, data, isOnline);
				
		return cp;
	}
	
	inline function drawHighlight()
	{	
		if (this.data.selected)
			g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 0.9 : 0.8));
		else if (isDefined(this.data.hasLicense) && !isDefined(this.data.installedVersion))
			g.setColour(Colours.withAlpha(Colours.lightgreen, this.data.hover ? 0.3 : 0.5));
		else if (this.data.hasUpdate)
			g.setColour(Colours.withAlpha(Colours.wheat, this.data.hover ? 0.5 : 0.7));
		else
			g.setColour(Colours.withAlpha(Colours.black, this.data.hover ? 0.3 : 0.5));

		g.drawRoundedRectangle([a[0], a[1], a[2], a[3] - 25], 2, 2);		
	}

	inline function drawPlaceholderImage()
	{
		g.setColour(0x882F2F34);
		g.fillRoundedRectangle([a[0], a[1], a[2], a[2]], {CornerSize: 5, Rounded: [1, 1, 0, 0]});
		
		g.setColour(0xffe2e2e2);
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[0] + a[2] / 2 - a[2] / 5 / 2, a[0] + a[2] / 2 - a[2] / 5 / 2, a[2] / 5, a[2] / 5]);
	}
	
	inline function drawProgressIndicator(a, progress)
	{
		local v = progress.value / 100;
		local diameter = a[2] / 1.3;
		local arcArea = [a[0] + a[2] / 2 - diameter / 2, a[1] + (a[3] - 25) / 2 - diameter / 2, diameter, diameter];
		local path = Content.createPath();
		local arcThickness = 0.05;
		local startOffset = 3.15;
		local endOffset = -startOffset + 2.0 * startOffset * v;

		g.setColour(Colours.withAlpha(Colours.black, 0.8));
		g.fillRect([a[0], a[1], a[2], a[3] - 25]);

		g.setColour(Colours.withAlpha(Colours.darkgrey, 0.6));
		g.drawEllipse(arcArea, 13);

	    g.setColour(Colours.withAlpha(Colours.white, 1.0));

	    endOffset = Math.max(endOffset, -startOffset + 0.01);
	    path.addArc(arcArea, -startOffset, endOffset);

	    g.drawPath(path, pathArea, a[2] * arcThickness);

		g.setColour(Colours.white);
		g.setFont("bold", Engine.getOS() == "WIN" ? 34 : 30);
	    g.drawAlignedText(progress.value + "%", [a[0], a[1] - 35, a[2], a[3] - 25], "centred");

		g.setFont("semibold", Engine.getOS() == "WIN" ? 18 : 16);
		g.drawAlignedText(progress.message, [a[0], a[1], a[2], a[3] - 25], "centred");

		if (isDefined(progress.speed))
		{
			g.setFont("medium", Engine.getOS() == "WIN" ? 18 : 16);
			g.drawAlignedText(progress.speed, [a[0], a[2] - 45, a[2], 25], "centred");
		}
	}

	inline function addAbortButton(cp, data, isOnline)
	{
		if (!isOnline)
			return;
						
		if ((!isDefined(data.hasLicense) || !data.hasLicense) && data.regularPrice != "0")
			return;

		local area = cp.getLocalBounds(0);	
		local b = cp.addChildPanel();
			
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
			this.setValue(event.clicked);
			this.data.hover = event.hover;
			this.repaint();

			if (event.mouseUp)
				this.changed();
		});

		cp.data.bcIsDownloading.addListener(b, "Show abort button during download", function(state)
		{
			this.showControl(state);
			this.repaint();
		});

		cp.data.btnAbort = b;
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
}