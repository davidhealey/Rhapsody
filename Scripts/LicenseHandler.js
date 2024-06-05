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

namespace LicenseHandler
{
	// pnlAddLicense
	const pnlAddLicense = Content.getComponent("pnlAddLicense");
	pnlAddLicense.showControl(false);

	pnlAddLicense.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		LookAndFeel.fullPageBackground();
		
		var lblArea = [lblAddLicense.get("x") - 10, lblAddLicense.get("y") - 8, lblAddLicense.getWidth() + 20, lblAddLicense.getHeight() + 16];
		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle(lblArea, 5);

		g.setFont("semibold", 26);
		g.setColour(Colours.withAlpha(this.get("textColour"), 1.0));
		g.drawAlignedText("Add a License Key", [lblArea[0] + 2, lblArea[1] - 90, a[2], 30], "left");

		g.setColour(Colours.withAlpha(this.get("itemColour2"), 0.9));
		
		g.fillPath(Paths.icons.infoCircle, [lblArea[0] + 2, lblArea[1] - 37, 13, 13]);
		
		g.setFont("regular", 16);
		g.drawAlignedText("Enter your license key and click submit.", [lblArea[0] + 22, lblArea[1] - 40, lblArea[2], 20], "left");
	});
	
	// lblAddLicense
	const lblAddLicense = Content.getComponent("lblAddLicense");
	lblAddLicense.setLocalLookAndFeel(LookAndFeel.empty);
	lblAddLicense.set("text", "");
	
	// btnAddLicenseCancel
	const btnAddLicenseCancel = Content.getComponent("btnAddLicenseCancel");
	btnAddLicenseCancel.setLocalLookAndFeel(LookAndFeel.textButton);
	btnAddLicenseCancel.setControlCallback(onbtnAddLicenseCancelControl);
	
	inline function onbtnAddLicenseCancelControl(component, value)
	{
	    if (!value)
	    	hide();
	}
	
	// btnAddLicenseSubmit
    const btnAddLicenseSubmit = Content.getComponent("btnAddLicenseSubmit");
    btnAddLicenseSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
    btnAddLicenseSubmit.setControlCallback(onbtnAddLicenseSubmitControl);

    inline function onbtnAddLicenseSubmitControl(component, value)
    {
		if (value)
			return;
			
		local license = lblAddLicense.get("text").trim();
		
		if (license == "" || !license.contains("-") || license.length != 19)
			return Engine.showMessageBox("License Error", "Please enter a valid license key.", 1);

		addProductLicenseToAccount(license);
		hide();
		lblAddLicense.set("text", "");
    }

    // Functions
    inline function show()
    {
		if (!Account.isLoggedIn())
			return Engine.showMessageBox("Login Required", "You need to be logged in to do this.", 0);
			
		if (!Server.isOnline())
			return Engine.showMessageBox("Offline", "An internet connection is required.", 0);

		pnlAddLicense.fadeComponent(true, 100);
    }
    
    inline function hide()
    {
	    pnlAddLicense.fadeComponent(false, 100);
    }
    
    inline function addProductLicenseToAccount(licenseKey)
    {
    	local token = Account.readToken();
    	local endpoint = App.apiPrefix + "transfer_license";
    	local headers = ["Authorization: Bearer " + token];
    	local p = {"license_key": licenseKey};

		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.setHttpHeader(headers.join("\n"));
    	
    	Spinner.show("Adding license to your account");
    	
    	Server.callWithPOST(endpoint, p, function(status, response)
    	{
    		Spinner.hide();
    
    		if (status == 200 && typeof response == "object")
    		{
    			if (isDefined(response.status))
					return Engine.showMessageBox("Server Error: " + status, response, 1);

   				Library.updateCache(false);
   				return Engine.showMessageBox("Success", "The license was added to your account", 0);
    		}
    		else
    		{
    			var msg = "There was a problem adding the license to your account. Please contact support.";

    			if (isDefined(response.code) && response.code == "rest_invalid_param")
    				msg = "The license key you entered was not recognised.";
    			else if (isDefined(response.message))
    				msg = response.message;
    
    			return Engine.showMessageBox("Server Error: " + status, msg, 1);
    		}
    	});
    }
}