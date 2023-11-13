/*
    Copyright 2022, 2023 David Healey

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

namespace Downloader
{
	const queue = [];
	const downloads = [];

	reg tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave");
	reg abort;
	
	Server.setNumAllowedDownloads(3);

	// Functions
	inline function downloadProduct(data)
	{
		abort = false;
		downloads.clear();
		
		data.tempDir = tempDir.createDirectory(data.id);

		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.cleanFinishedDownloads();

		for (x in data.downloads)
		{
			local f = data.tempDir.getChildFile(x.filename);
			local url = x.download_url.replace(App.baseUrl[App.mode]);

			downloads.push(Server.downloadFile(url, {}, f, function[data]()
			{
				downloadCallback();
				updateProgress(data);
			}));
		}
		
		App.broadcasters.isDownloading.state = true;
	}
	
	inline function downloadCallback()
	{
		if (abort || abort == -1)
			this.abort();

		if (!this.data.finished)
			return;

		downloads.remove(this);

		if (this.data.success)
		{
			if (downloads.length != 0)
				return;

			if (queue[0].format == "expansion")
				return Expansions.automatedInstall(queue[0]);
			else
				return Plugins.automatedInstall(queue[0]);
		}

		if (!downloads.length)
			cleanUp();

		local msg = abort ? "The download was cancelled" : "The download failed";
		Engine.showMessageBox("Failed", msg, 1);
		abort = -1;
	}

	inline function updateProgress(data)
	{
		local result = {};
		local progress = [0];
		local speed = 0;

		if (!this.isRunning())
			return;

		for (x in downloads)
		{
			if (!x.isRunning()) continue;

			progress.push(x.getNumBytesDownloaded() / x.getDownloadSize());
			speed += x.getDownloadSpeed();
		}

		progress.sort();
		progress.reverse();

		result.value = Math.round(Math.min(100, progress[0] * 100));

		if (speed > 0)
			result.speed = FileSystem.descriptionOfSizeInBytes(speed) + "/s";

		result.message = "Downloading: " + (data.downloads.length - downloads.length + 1) + "/" + data.downloads.length;

		data.bcProgress.progress = result;
	}

	inline function addToQueue(data)
	{
		local headers = ["Authorization: Bearer " + Account.readToken()];
		local endpoint =  App.apiPrefix + "get_downloads/";
		local version = isDefined(data.installedVersion) ? data.installedVersion : 0;
		local id = data.id;
		local p = {product_id: id, user_os: Engine.getOS(), user_version: version};

		Server.setHttpHeader(headers.join("\n"));
		Server.setBaseURL(App.baseUrl[App.mode]);

		Spinner.show("Verifying License");

		Server.callWithGET(endpoint, p, function[data](status, response)
		{
			Spinner.hide();

			if (status == 0)
				return Engine.showMessageBox("Server Error: " + status, "The server is currently offline. Please try again later.", 1);

			if (status != 200)
			{
				if (isDefined(response.message))
					return Engine.showMessageBox("Server Error: " + status, response.message, 1);
				else
					return Engine.showMessageBox("Server Error: " + status, "A server error occurred. Please try again later.", 1);
			}
				
			if (!isDefined(response[0]) || !response[0])
				return Engine.showMessageBox("Verification Required", response.message, 1);

			data.downloads = response;
			data.bcIsDownloading.state = true;
			data.bcProgress.progress = {value: 0, message: "Waiting to Start"};
			queue.push(data);
 
			if (queue.length == 1)
				downloadProduct(data);
		});
	}

	inline function removeFromQueue(data)
	{
		if (queue.contains(data))
		{
			data.bcIsDownloading.state = false;
			data.bcProgress.progress = -1;
			data.downloads = undefined;

			if (!isDefined(data.installedVersion))
				data.sampleDir = undefined;

			queue.remove(data);
		}
	}

	inline function cleanUp()
	{
		local data = queue[0];

		Server.cleanFinishedDownloads();

		if (isDefined(data.tempDir) && data.tempDir.isDirectory())
			data.tempDir.deleteFileOrDirectory();

		if (data.format == "expansion")
			data.installedVersion = Expansions.getInstalledVersion(data.projectName);
		else
			data.installedVersion = data.latestVersion;

		data.hasUpdate = false;

		removeFromQueue(data);

		if (queue.length > 0)
			return downloadProduct(queue[0]);

		App.broadcasters.isDownloading.state = false;
		clearTempFolder();
	}

	inline function clearTempFolder()
	{
		if (isDefined(tempDir) && tempDir.isDirectory())
			tempDir.deleteFileOrDirectory();

		tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave");
	}

	inline function abortDownloads(data)
	{
		if (data.id != queue[0].id)
			return removeFromQueue(data);
		else
			abort = true;
	}
}
