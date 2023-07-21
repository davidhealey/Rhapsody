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

namespace Filter
{
	// pnlFilter
	const pnlFilter = Content.getComponent("pnlFilter");
	
	pnlFilter.setPaintRoutine(function(g)
	{
		LookAndFeel.drawInput(lblFilter, {id: "search", width: 16, height: 16}, true, 0);
	});
	
	pnlFilter.setMouseCallback(function(event)
	{
		if (event.clicked)
			lblFilter.grabFocus();
	});
	
	// lblFilter
	const lblFilter = Content.getComponent("lblFilter");
	lblFilter.set("text", "");
	lblFilter.setControlCallback(onlblFilterControl);
	
	inline function onlblFilterControl(component, value)
	{
		Grid.filterTiles();
	}
	
	// Functions
	inline function getTileIndexes(tiles)
	{
		local result = [];
		local query = lblFilter.getValue().toLowerCase();
		local filterValue = 1;
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