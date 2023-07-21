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

namespace SplashScreen
{
	// pnlSplashScreen
	const pnlSplashScreen = Content.getComponent("pnlSplashScreen");
	
	pnlSplashScreen.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.fillAll(this.get("bgColour"));
		
		g.setColour(this.get("textColour"));
		
		g.fillPath(Paths.logoWithBg, [a[2] / 2 - 50 / 2, a[3] / 2 - 125, 50, 50]);
		
		g.setFont("title", Engine.getOS() == "WIN" ? 56 : 36);
		g.drawAlignedText(Engine.getName().toUpperCase(), [a[0], a[1] - 30 - ((Engine.getOS() == "WIN") * 5), a[2], a[3]], "centred");
		
		g.fillPath(Paths.icons.trademark, [605, 348, 12, 12]);

		var w = a[2] / 5;
		var x = a[0] + a[2] / 2 - w / 2;
		var y = a[3] - 65;
		var h = 0.8;
		
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.3));
		g.fillRect([x, y, w, h]);
		
		g.setColour(this.get("textColour"));		
		g.fillRect([x, y, w * this.data.progress, h]);
				
		g.setFont("regular", 14);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.drawAlignedText(this.get("text"), [a[0], a[3] - 100, a[2], 30], "centred");

		g.setFont("regular", 18);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.3));
		g.drawAlignedText("v" + Engine.getVersion(), [a[0], a[1] + a[3] - 50, a[2] - 25, 50], "right");
	});

	pnlSplashScreen.setTimerCallback(function()
	{
		if (this.data.progress >= 0.9)
		{
			this.fadeComponent(false, 150);
			this.setValue(1);
			this.stopTimer();
		}
		else
		{
			this.data.progress += 0.1;
			this.set("text", "Loading.");
			this.showControl(true);
		}

		this.repaint();
	});

	if (!isDefined(App.mode) || App.mode != "development")
	{
		pnlSplashScreen.showControl(true);
		Engine.isPlugin() ? pnlSplashScreen.startTimer(50) : pnlSplashScreen.startTimer(100);
	}		
}