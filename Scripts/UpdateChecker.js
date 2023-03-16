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
	// Functions
	inline function autocheck()
	{
		local now = Date.getSystemTimeMs();
		local lastMs = 0;
		local lastChecked = UserSettings.getProperty("lastUpdateChecked");
		local updateFrequency = 7;

		if (!Server.isOnline())
			return;

		if (Engine.getName() != "Rhapsody" || isDefined(Expansions.getCurrent()))
			return;

		if (isDefined(lastChecked))
			lastMs = Date.ISO8601ToMilliseconds(lastChecked);

		if (lastMs == 0 || ((now - lastMs) / 86400000) > updateFrequency)
			checkForAppUpdate();
	}

	inline function checkForAppUpdate()
	{
		local endpoint = "/api/v1/repos/LibreWave/Rhapsody/releases?draft=false&pre-release=false";
		Server.setBaseURL("https://codeberg.org");
	
		Server.callWithGET(endpoint, {}, function(status, response)
		{
			if (status == 200)
			{
				UserSettings.setProperty("lastUpdateChecked", Date.getSystemTimeISO8601(true));

				if (response[0].tag_name > Engine.getVersion())
					showNotification();
			}
		});
	}

	inline function showNotification()
	{
		Engine.showYesNoWindow("Update Available", "An update is available for Rhapsody, would you like to go to the download page?", function(response)
		{
			if (response)
				Engine.openWebsite("https://librewave.com/rhapsody/");
		});
	}

	// Calls
	autocheck();
}