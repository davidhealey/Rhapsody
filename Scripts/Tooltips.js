/*
    Copyright 2021, 2022, 2023 David Healey

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

namespace Tooltips
{	
	// Timer
	const tooltipTimer = Engine.createTimerObject();
	
	tooltipTimer.setTimerCallback(function()
	{
		var id = Content.getComponentUnderMouse();
		var tooltip = "";

		if (isDefined(id) && id != "")
		{
			var component = Content.getComponent(id);
			tooltip = component.get("tooltip");
		}

		pnlTooltips.set("text", tooltip);
		pnlTooltips.repaint();
		pnlTooltips.fadeComponent(tooltip != "", 250);
	});
	
	tooltipTimer.startTimer(250);

	// Interface
	const pnlTooltips = Content.getComponent("pnlTooltips");
	pnlTooltips.set("text", "");

	pnlTooltips.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.fillAll(this.get("bgColour"));
		
		g.setFont("medium", 16);
		g.setColour(this.get("textColour"));
		g.drawAlignedText(this.get("text"), [a[0] + 15, a[1], a[2] - 30, a[3]], "left");
	});
	

}