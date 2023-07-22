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
	const NUM_COLS = 5;
	const MARGIN = 10;
	const VERTICAL_MARGIN = 25;

	reg selected = -1;

	// pnlGridContainer
	const pnlGridContainer = Content.getComponent("pnlGridContainer");
	
	pnlGridContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.fillAll(this.get("bgColour"));

		g.setColour(Colours.withAlpha(this.get("textColour"), 0.6));
		g.setFont("bold", Engine.getOS() == "WIN" ? 34 : 32);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 45], "centred");
	});

	// vptGrid
	const vptGrid = Content.getComponent("vptGrid");

	// pnlGrid
	const pnlGrid = Content.getComponent("pnlGrid");

	// Tile sizing
	reg COL_WIDTH = pnlGrid.getWidth() / NUM_COLS;
	const ROW_HEIGHT = COL_WIDTH + 55;
	const ROW_WIDTH = COL_WIDTH - MARGIN;
	
	// Functions
	inline function update(data)
	{
		local isOnline = Server.isOnline();

		removeAllTiles();

		for (x in data)
		{
			local cp = Tile.create(pnlGrid, [0, 0, ROW_WIDTH, ROW_HEIGHT], x, isOnline);
			updateImage(x.projectName);
		}

		filterTiles();
	}
	
	inline function updateTile(data)
	{
		local cp = getChildPanel(data.projectName);
		
		if (!isDefined(cp))
			return;

		cp.repaint();
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

		pnlGrid.set("height", Math.max(ROW_HEIGHT, numRows * ROW_HEIGHT));
		pnlGrid.set("width", 975 + ((numRows < 3) * 15));
		vptGrid.set("width", 985 + ((numRows < 3) * 5));
		COL_WIDTH = pnlGrid.getWidth() / NUM_COLS;

		for (i = 0; i < filteredChildren.length; i++)
		{
			local childPanel = filteredChildren[i];
			local x = (i % NUM_COLS) * COL_WIDTH + COL_WIDTH / 2 - ROW_WIDTH / 2;
			local y = Math.floor(i / NUM_COLS) * ROW_HEIGHT + Config.VERTICAL_MARGIN * Math.floor(i / NUM_COLS);
			
			childPanel.setPosition(x, y, ROW_WIDTH, ROW_HEIGHT);
			childPanel.showControl(true);
			childPanel.repaint();
		}
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

	inline function updateImage(projectName)
	{
		local cp = getChildPanel(projectName);

		if (!isDefined(cp))
			return;
			
		local img = getImagePath(projectName);

		cp.unloadAllImages();
		cp.loadImage(img, projectName);

		local imageSize = cp.getImageSize(projectName);

		if (imageSize[0] != imageSize[1])
			cp.unloadAllImages();

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
			return img.toString(image.FullPath);
		
		return undefined;
	}

	inline function getImagePath(projectName)
	{
		local path = Expansions.getImagePath(projectName, "Icon");

		if (!isDefined(path))
			return getCachedImagePath(projectName);

		return path;
	}
	
	inline function deselectAll()
	{
		selected = -1;

		for (x in pnlGrid.getChildPanelList())
		{
			x.data.selected = false;
			x.repaint();
		}

		ActionBar.hideAll();		
	}
	
	inline function setSelected(projectName)
	{
		local cp = getChildPanel(projectName);
		
		if (cp != selected && selected != -1)
		{
			selected.data.selected = false;	
			selected.repaint();
		}			

		selected = selected == cp ? -1 : cp;
		cp.data.selected = selected == -1 ? false : true;
		cp.repaint();

		if (selected != -1)
			ActionBar.show(cp.data);
		else
			ActionBar.hideAll();
	}
	
	inline function getSelected()
	{
		return selected;
	}
}