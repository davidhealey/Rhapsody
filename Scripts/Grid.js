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

namespace Grid
{
	const MARGIN = 10;
	const NUM_COLS = 4;

	// pnlGridContainer
	const pnlGridContainer = Content.getComponent("pnlGridContainer");
	
	pnlGridContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.fillAll(this.get("bgColour"));
		
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.6));
		g.setFont("bold", 32);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 45], "centred");
	});

	// vptGrid
	const vptGrid = Content.getComponent("vptGrid");

	// pnlGrid
	const pnlGrid = Content.getComponent("pnlGrid");
	
	pnlGrid.setPaintRoutine(function(g)
	{
		for (cp in this.getChildPanelList())
		{
			if (!cp.get("visible"))
				continue;

			var a = [cp.get("x"), cp.get("y"), cp.getWidth(), cp.getHeight()];
			g.drawDropShadow([a[0], a[1] + 8, a[2], a[3] - 10], Colours.withAlpha(Colours.black, 0.8), 20);
			
			g.setColour(this.get("bgColour"));
			g.fillRoundedRectangle(a, 5);
		}
	});

	reg TILE_WIDTH = pnlGrid.getWidth() / NUM_COLS - MARGIN;
	reg TILE_HEIGHT = TILE_WIDTH + 40;

	// Functions
	inline function update(data)
	{
		local isOnline = false;

		if (Account.isLoggedIn())
			isOnline = Server.isOnline();

		removeAllTiles();

		for (x in data)
		{
			local cp = Tile.create(pnlGrid, [0, 0, TILE_WIDTH, TILE_HEIGHT], x, isOnline);
			updateImage(x.projectName);
		}

		filterTiles();
	}

	inline function filterTiles()
	{
		local childPanels = pnlGrid.getChildPanelList();	
		
		for (x in childPanels)
			x.showControl(false);

		local indexes = Filter.getTileIndexes(childPanels);
		local numRows = Math.ceil(indexes.length / NUM_COLS);		
		local filteredChildren = [];
		
		for (index in indexes)
			filteredChildren.push(childPanels[index]);

		Engine.sortWithFunction(filteredChildren, sortChildPanels);

		pnlGridContainer.set("text", filteredChildren.length > 0 ? "" : "Nothing to see here.");
		pnlGridContainer.repaint();

		pnlGrid.set("height", Math.max(TILE_HEIGHT, numRows * TILE_HEIGHT + MARGIN * numRows));

		for (i = 0; i < filteredChildren.length; i++)
		{
			local index = (i % NUM_COLS);
			local childPanel = filteredChildren[i];
			local x = MARGIN + (index * TILE_WIDTH) + (index * MARGIN);
			local y = Math.floor(i / NUM_COLS) * (TILE_HEIGHT + MARGIN);

			childPanel.setPosition(x, y, TILE_WIDTH, TILE_HEIGHT);
			childPanel.showControl(true);
			childPanel.repaint();
		}
		
		pnlGrid.repaint();
	}

	inline function sortChildPanels(a, b)
	{
		if (a.data.projectName < b.data.projectName)
			return -1;
		else
			return a.data.projectName > b.data.projectName;
	}

	inline function getChildPanel(projectName)
	{
		for (x in pnlGrid.getChildPanelList())
		{
			if (x.data.projectName == projectName)
				return x;
		}

		return undefined;
	}
	
	inline function updateTileData(projectName, data)
	{
		local cp = getChildPanel(projectName);
		cp.data = data;
		Tile.removeButtons(cp);
		Tile.addButtons(cp, Server.isOnline());
		cp.repaint();	
	}

	inline function updateImage(projectName)
	{
		local cp = getChildPanel(projectName);

		if (!isDefined(cp))
			return;

		cp.unloadAllImages();
	
		local img;
		
		if (cp.data.format == "expansion")
			img = Expansions.getImagePath(projectName, "Icon");
		else
			img = Plugins.getImagePath(projectName, "Icon");

		if (isDefined(img))
			cp.loadImage(img, projectName);

		if (!isDefined(img))
		{
			cp.unloadAllImages();

			img = getCachedImagePath(projectName);

			if (isDefined(img))
				cp.loadImage(img, projectName);
		}

		cp.data.img = img;
		cp.repaint();
	}
	
	inline function removeAllTiles()
	{
		for (x in pnlGrid.getChildPanelList())
		{
			x.unloadAllImages();
			x.removeFromParent();
		}
	}
	
	inline function getCachedImagePath(projectName)
	{
		local cache = FileSystem.getFolder(FileSystem.AppData).getChildFile("cache");
		local img = cache.getChildFile(projectName + ".jpg");

		if (isDefined(img) && img.isFile())
			return img.toString(img.FullPath);
		
		return undefined;
	}
}