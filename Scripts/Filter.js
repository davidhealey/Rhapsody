/*
    Copyright 2023, 2024 David Healey

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

namespace Filter
{
	reg filterValue = 1;

	// pnlFilter
	const pnlFilter = Content.getComponent("pnlFilter");
	pnlFilter.set("text", "Search...");

	pnlFilter.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, 5);

		g.setColour(this.get("textColour"));
		g.fillPath(Paths.icons.search, [a[0] + 14.5, a[3] / 2 - 13 / 2, 13, 13]);

		g.drawVerticalLine(a[0] + 41, a[1] + 11, a[3] - 11);
		
		g.setFont(lblFilter.get("fontName"), lblFilter.get("fontSize"));
		g.drawAlignedText(this.get("text"), [lblFilter.get("x"), lblFilter.get("y"), lblFilter.getWidth(), lblFilter.getHeight()], "left");
	});
	
	// lblFilter
	const lblFilter = Content.getComponent("lblFilter");
	lblFilter.set("text", "");
	lblFilter.setConsumedKeyPresses("all");
	lblFilter.setControlCallback(onlblFilterControl);
	
	inline function onlblFilterControl(component, value)
	{
		Grid.filterTiles();
	}
	
	lblFilter.setKeyPressCallback(function(obj)
	{
		var grabbedFocus = (obj.isFocusChange && !obj.hasFocus);

		if (this.get("text") == "" && !isDefined(obj.character) && !grabbedFocus)
			pnlFilter.set("text", "Search...");
		else
			pnlFilter.set("text", "");

		btnFilterClear.showControl(this.get("text") != "" || isDefined(obj.character));

		pnlFilter.repaint();
	});
	
	// btnFilterClear
	const btnFilterClear = Content.getComponent("btnFilterClear");
	btnFilterClear.showControl(false);
	btnFilterClear.setLocalLookAndFeel(LookAndFeel.iconButton);
	btnFilterClear.setControlCallback(onbtnFilterClearControl);
	
	inline function onbtnFilterClearControl(component, value)
	{
		if (value)
			return;

		pnlFilter.set("text", "Search...");
		pnlFilter.repaint();
		lblFilter.set("text", "");
		lblFilter.changed();
	}
	
	// btnFavourites
	const btnFavourites = Content.getComponent("btnFavourites");
	btnFavourites.setValue(0);
	btnFavourites.setLocalLookAndFeel(LookAndFeel.textIconButton);
	btnFavourites.setControlCallback(onbtnFavouritesControl);
	
	inline function onbtnFavouritesControl(component, value)
	{
		filterValue = value == 1 ? 5 : 1;
		Grid.filterTiles();
	}
	
	// Functions
	inline function getTileIndexes(tiles)
	{
		local result = [];
		local query = lblFilter.getValue().toLowerCase();
		local index = 0;
		
		for (tile in tiles)
		{
			local x = tile.data;
			local tags = x.tags.length > 0 ? x.tags : [""];

			for (i = 0; i < tags.length; i++)
			{
				local t = tags[i].toLowerCase();
				local value;

				if (!Engine.matchesRegex(t.toLowerCase(), query) && !Engine.matchesRegex(x.name.toLowerCase(), query))
					continue;

				switch (filterValue)
				{
					case 1:
						value = index;
						break;
						
					case 2:
						value = isDefined(x.installedVersion) ? index : undefined;
						break;
						
					case 3:
						if ((x.hasLicense && !isDefined(x.installedVersion)) || (x.regularPrice == "0"))
							value = index;
						break;

					case 4:
						value = (isDefined(x.hasUpdate) && x.hasUpdate) ? index : undefined;
						break;
						
					case 5:
						value = (isDefined(x.favourite) && x.favourite) ? index : undefined;
						break;
				}
				
				if (isDefined(value))
					result.push(value);

				break;				
			}
			
			index++;
		}

		return result;
	}
}