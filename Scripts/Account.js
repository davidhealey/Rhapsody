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

namespace Account
{
	const appData = FileSystem.getFolder(FileSystem.AppData);
		
	// btnLogout
	const btnLogout = Content.getComponent("btnLogout");
	btnLogout.setControlCallback(onbtnLogoutControl);

	inline function onbtnLogoutControl(component, value)
	{
		if (value)
			return;

		if (isLoggedIn())		
			logout();
		else
			autoLogout();
	}

	const lafbtnLogout = Content.createLocalLookAndFeel();
	btnLogout.setLocalLookAndFeel(LookAndFeel.textIconButton);

	App.broadcasters.isDownloading.addListener(btnLogout, "Disable logout button while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});

	// pnlLogin
	const pnlLogin = Content.getComponent("pnlLogin");
	
	pnlLogin.setPaintRoutine(function(g)
	{
    	var a = this.getLocalBounds(0);
    	
    	LookAndFeel.fullPageBackground("Login", "Login to your Libre Wave account.", ["user", 50, 50]);
    	LookAndFeel.drawInput(lblUsername, {id: "email", width: 18, height: 14}, false, 0);
    	LookAndFeel.drawInput(lblPassword, {id: "lock", width: 16, height: 20}, false, 35);
	});
	
	// lblUsername
	const lblUsername = Content.getComponent("lblUsername");
	
	// lblPassword
	const lblPassword = Content.getComponent("lblPassword");
	
	// btnShowPassword
	const btnShowPassword = Content.getComponent("btnShowPassword");
	btnShowPassword.setLocalLookAndFeel(LookAndFeel.iconButton);
	btnShowPassword.setControlCallback(onbtnShowPasswordControl);
	
	inline function onbtnShowPasswordControl(component, value)
	{
		lblPassword.set("fontStyle", value ? "plain" : "Password");
	}
	
	// btnLoginSubmit
	const btnLoginSubmit = Content.getComponent("btnLoginSubmit");
	btnLoginSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnLoginSubmit.setControlCallback(onbtnLoginSubmitControl);
	
	inline function onbtnLoginSubmitControl(component, value)
	{
		if (!value)
			login(lblUsername.get("text"), lblPassword.get("text"));
	}
	
	// btnLoginRecovery
	const btnLoginRecovery = Content.getComponent("btnLoginRecovery");
	btnLoginRecovery.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnLoginRecovery.setControlCallback(onbtnLoginRecoveryControl);

	inline function onbtnLoginRecoveryControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "my-account/lost-password/");
	}
	
	// btnRegisterAccount
	const btnRegisterAccount = Content.getComponent("btnRegisterAccount");
	btnRegisterAccount.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnRegisterAccount.setControlCallback(onbtnRegisterAccountControl);
	
	inline function onbtnRegisterAccountControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "my-account/");
	}
	
	// btnOfflineMode
	const btnOfflineMode = Content.getComponent("btnOfflineMode");
	btnOfflineMode.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnOfflineMode.setControlCallback(onbtnOfflineModeControl);
	
	inline function onbtnOfflineModeControl(component, value)
	{
		if (value)
			return;

		btnLogout.set("text", "login");
		btnLogout.set("tooltip", "Login");
		btnLogout.set("width", 67);
		UserSettings.setProperty(Engine.getName().toLowerCase(), "offline-mode", true);
		App.broadcasters.loginChanged.state = false;
		hide();
	}

	// Functions
	inline function show()
	{
		lblUsername.set("text", "");
		lblPassword.set("text", "");
		pnlLogin.showControl(true);
	}
	
	inline function hide()
	{
		pnlLogin.showControl(false);
	}

	inline function login(username, password)
	{
		local p = {"username": username.trim(), "password": password};

		if (!Server.isOnline())
			return Engine.showMessageBox("Offline", "You need to be connected to the internet to do this.", 3);
				
		if (!isDefined(username) || username == "")
			return Engine.showMessageBox("Invalid Email", "Please enter a valid email address or username.", 3);
		
		if (!isDefined(password) || password == "")
			return Engine.showMessageBox("Invalid Password", "Please enter a valid password.", 3);
			
		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);
		
		Spinner.show("Logging In");

		Server.callWithPOST("wp-json/jwt-auth/v1/token", p, function[p](status, response)
		{
			Spinner.hide();

			if (status == 200 && isDefined(response.data.token))
		        onLoginSuccess(response.data.token);
		    else
				onLoginFailed(response);
		});
	}
	
	inline function logout()
	{
		Engine.showYesNoWindow("Confirmation", "Do you want to logout?", function(response)
		{
			if (response)
				autoLogout();
		});
	}

	inline function autoLogout()
	{
		deleteToken();
		UserSettings.setProperty(Engine.getName().toLowerCase(), "offline-mode", false);
		show();
		App.broadcasters.loginChanged.state = false;
	}

	inline function onLoginSuccess(token)
	{
		writeToken(token);
		btnLogout.set("text", "log out");
		btnLogout.set("tooltip", "Sign out of Rhapsody");
		btnLogout.set("width", 74);
		btnLogout.sendRepaintMessage();
		UserSettings.setProperty(Engine.getName().toLowerCase(), "offline-mode", false);
		App.broadcasters.loginChanged.state = true;
		hide();
	}

	inline function onLoginFailed(response)
	{
		local msg = "A server error occurred. Please try again later.";

		if (status == 0)
		{
			msg = "The server could not be reached. The Libre Wave website might be down. Please try again later.";
		}
		else if (isDefined(response.message))
		{
			if (response.message.contains("The password you entered"))
				msg = "The password you entered is incorrect";
			else if (response.message.contains("The username"))
				msg = "Unknown username. Check again or try your email address instead.";
			else
				msg = response.message;
		}

		Engine.showMessageBox("Log in failure", msg, 1);
	}
	
   	inline function deleteToken()
	{
		local f = appData.getChildFile("credentials.json");

		if (f.isFile())
			f.deleteFileOrDirectory();
	}

	inline function writeToken(token)
	{
		local data = {"token": token};
		local f = appData.getChildFile("credentials.json");

		f.writeEncryptedObject(data, FileSystem.getSystemId());
	}
    
	inline function readToken()
	{
		local f = appData.getChildFile("credentials.json");

		if (!isDefined(f) || !f.isFile())
			return undefined;

		local data = f.loadEncryptedObject(FileSystem.getSystemId());

		if (!isDefined(data) || !isDefined(data.token))
			return undefined;

		return data.token;
	}
	
	inline function isLoggedIn()
	{
		return isDefined(readToken()) && !pnlLogin.get("visible");
	}

	if (isDefined(readToken()) || UserSettings.getProperty(Engine.getName().toLowerCase(), "offline-mode"))
		hide();
	else
		show();
}