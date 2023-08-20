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

namespace UpdateChecker
{
	// pnlUpdateCheckerContainer
	const pnlUpdateCheckerContainer = Content.getComponent("pnlUpdateCheckerContainer");
	pnlUpdateCheckerContainer.showControl(false);
	
	pnlUpdateCheckerContainer.setPaintRoutine(function(g)
	{
		var a = [pnlUpdateChecker.get("x"), pnlUpdateChecker.get("y"), pnlUpdateChecker.getWidth(), pnlUpdateChecker.getHeight()];
		
		g.fillAll(this.get("bgColour"));
	
		g.drawDropShadow(a, Colours.withAlpha(Colours.black, 0.8), 20);
	});

	// pnlUpdateChecker
	const pnlUpdateChecker = Content.getComponent("pnlUpdateChecker");

	pnlUpdateChecker.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, this.get("borderRadius"));
		
		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle([vptChangeLog.get("x"), vptChangeLog.get("y") - 5, vptChangeLog.getWidth() + 5, vptChangeLog.getHeight() + 10], this.get("borderRadius"));
	});
	
	// vptChangeLog
	const vptChangeLog = Content.getComponent("vptChangeLog");
	
	// pnlChangeLog
	const pnlChangeLog = Content.getComponent("pnlChangeLog");	
	pnlChangeLog.set("text", "");
	
	pnlChangeLog.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
	
		var md = Content.createMarkdownRenderer();

		md.setTextBounds([a[0] + 10, a[1], a[2], a[3]]);
		md.setText(this.get("text"));
		md.setStyleData({"Font": "regular", "FontSize": 18.0});
	
		g.drawMarkdownText(md);
	});
	
	// btnUpdateCheckerSubmit
	const btnUpdateCheckerSubmit = Content.getComponent("btnUpdateCheckerSubmit");
	btnUpdateCheckerSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnUpdateCheckerSubmit.setControlCallback(onbtnUpdateCheckerCloseCoSubmit);
	
	inline function onbtnUpdateCheckerCloseCoSubmit(component, value)
	{
		if (!value)
		{
			hide();
			Engine.openWebsite("https://librewave.com/rhapsody/");
		}			
	}
	
	// btnUpdateCheckerClose
	const btnUpdateCheckerClose = Content.getComponent("btnUpdateCheckerClose");
	btnUpdateCheckerClose.setLocalLookAndFeel(LookAndFeel.filledIconButton);
	btnUpdateCheckerClose.setControlCallback(onbtnUpdateCheckerCloseControl);
	
	inline function onbtnUpdateCheckerCloseControl(component, value)
	{
		if (!value)
			hide();
	}	

	// Functions
	inline function autocheck()
	{
		local now = Date.getSystemTimeMs();
		local lastMs = 0;
		local lastChecked = UserSettings.getProperty(Engine.getName(), "lastUpdateChecked");
		local updateFrequency = 7;

		if (!Account.isLoggedIn())
			return;

		if (!Server.isOnline())
			return;

		if (isDefined(lastChecked))
			lastMs = Date.ISO8601ToMilliseconds(lastChecked);
 
		if (lastMs == 0 || ((now - lastMs) / 86400000) > updateFrequency)
			checkForAppUpdate();
	}

	inline function checkForAppUpdate()
	{
		local endpoint = "/api/v1/repos/LibreWave/Rhapsody/releases?draft=false&pre-release=false&limit=1";
		Server.setBaseURL("https://codeberg.org");
		Server.setHttpHeader("");

		Server.callWithGET(endpoint, {}, function(status, response)
		{
			if (status == 200)
			{
				UserSettings.setProperty(Engine.getName(), "lastUpdateChecked", Date.getSystemTimeISO8601(true));

				if (isDefined(response[0].tag_name) && response[0].tag_name > Engine.getVersion())
				{
					parseBody(response[0].body, response[0].tag_name);
					show();
				}
			}
		});
	}

	inline function parseBody(body, tag)
	{
		local heading = Engine.getName() + " " + tag + " is available with the following changes:";	
		local lines = body.replace("\n").trim().split("\r\n");
		local numLines = lines.length + 3;
		local changelog = "\r\n";

		for (l in lines)
		{
			local text = l;

			if (l.contains("#") || l.contains("made their first") || l.contains("Full Changelog"))
			{
				numLines--;
				continue;
			}

			if (l.contains("by @"))
				text = l.substring(0, l.indexOf("by @"));

			if (text.length > 60)
				text = text.substring(0, 55) + "...";

			if (text.charAt(0) != "*" && text.charAt(0) != "-")
				text = "-" + text;

			changelog += text + "\r\n";
		}

		changelog = changelog.replace("*", "-");

		pnlChangeLog.set("text", heading + changelog);
		pnlChangeLog.set("height", numLines * 25);
		pnlChangeLog.repaint();
	}
	
	inline function show()
	{	
		pnlUpdateCheckerContainer.fadeComponent(true, 250);
	}
	
	inline function hide()
	{
		pnlUpdateCheckerContainer.fadeComponent(false, 250);
	}
	
	// Listeners
	App.broadcasters.loginChanged.addListener("Update Checker Login", "Respond to login changes", function(state)
	{
		if (state)
			checkForAppUpdate();
	});

	// Calls
	autocheck();
}