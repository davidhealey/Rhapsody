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
	reg workingOffline = UserSettings.getProperty(Engine.getName().toLowerCase(), "offline-mode");
	
	// btnAccount
	const btnAccount = Content.getComponent("btnAccount");
	btnAccount.setControlCallback(onbtnAccountControl);

	inline function onbtnAccountControl(component, value)
	{
		if (value)
			return;

		if (isLoggedIn())		
			logout();
		else
			autoLogout();
	}

	const lafbtnAccount = Content.createLocalLookAndFeel();
	btnAccount.setLocalLookAndFeel(LookAndFeel.textIconButton);

	App.broadcasters.isDownloading.addListener(btnAccount, "Disable logout button while downloads are in progress", function(state)
	{
		this.set("enabled", !state);
	});

	// pnlLogin
	const pnlLogin = Content.getComponent("pnlLogin");
	
	pnlLogin.setPaintRoutine(function(g)
	{
    	var a = this.getLocalBounds(0);

		LookAndFeel.fullPageBackground();

		// Label backgrounds
		g.setColour(this.get("itemColour"));    	
		
    	var usernameArea = [lblUsername.get("x") - 36, lblUsername.get("y") - 8, lblUsername.getWidth() + 50, lblUsername.getHeight() + 16];
    	g.fillRoundedRectangle(usernameArea, 5);
    	
    	var passwordArea = [lblPassword.get("x") - 36, lblPassword.get("y") - 8, lblPassword.getWidth() + 71, lblPassword.getHeight() + 16];
    	g.fillRoundedRectangle(passwordArea, 5);

    	// Label icons
    	g.setColour(this.get("itemColour2"));
    	g.fillPath(Paths.icons.email, [usernameArea[0] + 12, usernameArea[1] + usernameArea[3] / 2 - 7, 18, 14]);    	
    	g.fillPath(Paths.icons.encrypted, [passwordArea[0] + 12, passwordArea[1] + passwordArea[3] / 2 - 10, 16, 20]);

    	// Title
    	g.setColour(this.get("textColour"));
    	g.setFont("bold", 20);
    	g.drawAlignedText("Login", [usernameArea[0] + 1, usernameArea[1] - 30, 100, 20], "left");
    	
    	// Labels
    	var submitArea = [btnLoginSubmit.get("x"), btnLoginSubmit.get("y"), btnLoginSubmit.getWidth(), btnLoginSubmit.getHeight()];
    	
    	g.setColour(Colours.withAlpha(this.get("textColour"), 0.4));
    	g.setFont("medium", 14);
    	
    	var stringWidth = g.getStringWidth("No Account? Sign Up");
    	g.drawAlignedText("No Account?", [submitArea[0] + submitArea[2] / 2 - stringWidth / 2, submitArea[1] + submitArea[3] + 24, stringWidth, 25], "left");
    	
    	g.setFont("regular", 14);
    	g.drawAlignedText("v" + Engine.getVersion(), [a[0], a[3] - 40, a[2] - 34, 25], "right");
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
	btnLoginRecovery.setControlCallback(onbtnLoginRecoveryControl);

	inline function onbtnLoginRecoveryControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "my-account/lost-password/");
	}
	
	const lafbtnLoginRecovery = Content.createLocalLookAndFeel();
	btnLoginRecovery.setLocalLookAndFeel(lafbtnLoginRecovery);
	
	lafbtnLoginRecovery.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;

		g.setColour(Colours.withAlpha(obj.textColour, obj.over ? 1.0 - 0.2 * obj.value : 0.8));		
		g.setFont("medium", 14);
		g.drawAlignedText(obj.text, a, "left");
	});
	
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
	btnOfflineMode.setControlCallback(onbtnOfflineModeControl);
	
	inline function onbtnOfflineModeControl(component, value)
	{
		if (value)
			return;

		showLoginButton();
		UserSettings.setProperty(Engine.getName().toLowerCase(), "offline-mode", true);
		workingOffline = true;
		App.broadcasters.loginChanged.state = false;
		hide();
	}
	
	const lafbtnOfflineMode = Content.createLocalLookAndFeel();
	btnOfflineMode.setLocalLookAndFeel(lafbtnOfflineMode);
	
	lafbtnOfflineMode.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
				
		g.setColour(Colours.withAlpha(obj.textColour, obj.over ? 1.0 - 0.2 * obj.value : 0.8));
		g.fillPath(Paths.icons.offline, [a[0], a[3] / 2 - 6, 15, 12]);
		
		g.setFont("medium", 14);
		g.drawAlignedText(obj.text, [20, a[1], a[2], a[3]], "left");
	});
	
	// btnGettingStarted
	const btnGettingStarted = Content.getComponent("btnGettingStarted");
	btnGettingStarted.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnGettingStarted.setControlCallback(onbtnGettingStartedControl);
	
	inline function onbtnGettingStartedControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "rhapsody/");
	}
	
	// btnDocumentation
	const btnDocumentation = Content.getComponent("btnDocumentation");
	btnDocumentation.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnDocumentation.setControlCallback(onbtnDocumentationControl);
	
	inline function onbtnDocumentationControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "knowledge-base/");
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
		showLogoutButton();
		btnAccount.sendRepaintMessage();
		workingOffline = false;
		UserSettings.setProperty(Engine.getName().toLowerCase(), "offline-mode", false);
		App.broadcasters.loginChanged.state = true;
		hide();
	}
	
	inline function showLoginButton()
	{
		btnAccount.set("text", "login");
		btnAccount.set("tooltip", "Login");
		btnAccount.set("width", 67);
	}
	
	inline function showLogoutButton()
	{
		btnAccount.set("text", "log out");
		btnAccount.set("tooltip", "Sign out of Rhapsody");
		btnAccount.set("width", 74);
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

	inline function init()
	{
		if (isDefined(readToken()) || workingOffline)
		{
			hide();
			workingOffline ? showLoginButton() : showLogoutButton();
			return;
		}

		show();
	}
	
	// Calls
	init();		
}