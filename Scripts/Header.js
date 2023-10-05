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

namespace Header
{
	// pnlHeader
	const pnlHeader = Content.getComponent("pnlHeader");
	
	pnlHeader.setPaintRoutine(function(g)
	{
		g.fillAll(this.get("bgColour"));
	});
	
	// btnLogo
	const btnLogo = Content.getComponent("btnLogo");
	btnLogo.setControlCallback(onbtnLogoControl);
	
	inline function onbtnLogoControl(component, value)
	{
		if (value)
			return;
			
		Engine.showYesNoWindow("Visit Website", "Would you like to visit the Libre Wave website?", function(response)
		{
			if (response)
				Engine.openWebsite(App.baseUrl[App.mode]);
		});		
	}

	const lafbtnLogo = Content.createLocalLookAndFeel();
	btnLogo.setLocalLookAndFeel(lafbtnLogo);

	lafbtnLogo.registerFunction("drawToggleButton", function(g, obj)
	{
		 var a = obj.area;
		 var down = obj.down || obj.value;
		 
		 g.setColour(Colours.withAlpha(obj.itemColour1, obj.over && obj.enabled ? 0.8 + 0.3 * down: 0.9 - (0.3 * !obj.enabled)));
		 		 
		 g.fillPath(Paths.rhapsodyLogoWithBg, [a[0], a[1], a[3], a[3]]);

		 g.setFont("title", Engine.getOS() == "WIN" ? 29 : 25);
		 g.drawAlignedText("RHAPSODY", [a[0] + a[3] + 10, a[1], a[2] - a[3] - 20, a[3] + 6], "left");
	});
}