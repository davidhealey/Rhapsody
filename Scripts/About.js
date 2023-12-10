namespace About
{
	// pnlAboutContainer
	const pnlAboutContainer = Content.getComponent("pnlAboutContainer");
	
	pnlAboutContainer.setPaintRoutine(function(g)
	{		
		g.fillAll(this.get("bgColour"));
		
		// Draw shadow
		var a = [pnlAbout.get("x"), pnlAbout.get("y"), pnlAbout.getWidth(), pnlAbout.getHeight()];
		g.drawDropShadow([a[0], a[1], a[2], a[3] + 10], Colours.withAlpha(Colours.black, 0.6), 25);
		
	});
	
	pnlAboutContainer.setMouseCallback(function(event)
	{
		if (event.clicked)
			hide();
	});
	
	// pnlAbout
	const pnlAbout = Content.getComponent("pnlAbout");
	
	pnlAbout.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		// Background
		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, 10);
	
		// Inner frame
		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle([30, 82, 510, 183], 10);

		// Abstract lines
		g.setColour(Colours.withAlpha(this.get("itemColour2"), 0.2));
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[2] / 1.5, a[3] / 2 - 130 / 2 + 3, 130, 130]);

		// Project name
		g.setColour(this.get("textColour"));
		g.setFontWithSpacing("title", 20, 0.1);
		g.drawAlignedText(this.get("text"), [30, a[1] + 30, a[2], 15], "left");
		
		// Libre Wave logo
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.4));
		g.fillPath(Paths.icons["logo"], [444, 31, 96, 12]);	
	});
	
	// btnAboutDocumentation
	const btnAboutDocumentation = Content.getComponent("btnAboutDocumentation");
	btnAboutDocumentation.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnAboutDocumentation.setControlCallback(onbtnAboutDocumentationControl);
	
	inline function onbtnAboutDocumentationControl(component, value)
	{
		if (!value)
			Engine.openWebsite(Engine.getProjectInfo().CompanyURL + "/knowledge-base/");
	}

	// btnAboutSupport
	const btnAboutSupport = Content.getComponent("btnAboutSupport");
	btnAboutSupport.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnAboutSupport.setControlCallback(onbtnAboutSupportControl);
	
	inline function onbtnAboutSupportControl(component, value)
	{
		if (!value)			
			Engine.openWebsite(Engine.getProjectInfo().CompanyURL + "/my-account/support/");
	}
	
	// Functions
	inline function hide()
	{
		pnlAboutContainer.showControl(false);
	}
	
	inline function show()
	{
		pnlAboutContainer.showControl(true);
	}
}