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

namespace App
{
	const mode = "release";
	
	Synth.deferCallbacks(true);
	
	Engine.loadFontAs("{PROJECT_FOLDER}fonts/JosefinSans-Bold.ttf", "title");
	Engine.loadAudioFilesIntoPool();
	
	const systemId = FileSystem.getSystemId();
	
	const apiPrefix = "wp-json/librewave/v1/";
	
	const baseUrl = {
		"development": "http://192.168.0.184/",
		"testing": "http://192.168.0.184/",
		"staging": "https://librewave.com/",
		"release": "https://librewave.com/"
	};
	
	const broadcasters = {
		isDownloading: Engine.createBroadcaster({"id": "Global download State", "args": ["state"]}),
		loginChanged: Engine.createBroadcaster({"id": "Triggered when user logs in or out", "args": ["state"]})
	};
	
	broadcasters.isDownloading.state = false;
}