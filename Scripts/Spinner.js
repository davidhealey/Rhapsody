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

namespace Spinner
{
	// pnlSpinnerContainer
	const pnlSpinnerContainer = Content.getComponent("pnlSpinnerContainer");

	// pnlSpinner
	const pnlSpinner = Content.getComponent("pnlSpinner");
	pnlSpinner.setValue(0);

	pnlSpinner.setPaintRoutine(function(g)
	{
		var a = [this.getWidth() / 2 - 50, this.getHeight() / 2 - 50, 100, 100];

		g.fillAll(Colours.withAlpha(Colours.black, 0.5));
			    
	    for (i = 0; i < 10; i++)
	    {
	        this.getValue() == i ? g.setColour(Colours.white) : g.setColour(Colours.grey);
	        
	        var x = this.getWidth() / 2 - 0;
	        var y1 = a[1] + 20;
	        var y2 = this.getHeight() / 2 - 70;        
	        
	        g.drawLine(x, x, y1, y2, 4);
	        
	        g.rotate(Math.toRadians(360 / 10), [this.getWidth() / 2, this.getHeight() / 2]);
	    }

		g.setColour(Colours.withAlpha(Colours.white, 1 / 10 * this.getValue()));

		if (this.data.msg != "")
		{
			g.setFont("medium", 26);
			g.drawAlignedText(this.data.msg, [0, a[1] + a[3] + 50, this.getWidth(), 30], "centred");
		}        	
	});
	
	pnlSpinner.setTimerCallback(function()
	{
    	var v = (this.getValue() + 1) % 10;
    	this.setValue(v);
    	this.repaint();
	});
	
	// Functions
	/**
	* Sets the message displayed on the spinner panel
	*
	* @msg    string    The message to display
	*/
	inline function setMessage(msg)
	{
		pnlSpinner.data.msg = msg;
	}
	
	/*
	* Show the spinner
	*
	* @msg    string    The message to display
	*/
	inline function show(msg)
	{
		pnlSpinner.startTimer(150);
		setMessage(msg);
		pnlSpinnerContainer.showControl(true);
	}
	
	/*
	* Hide the spinner
	*/
	inline function hide()
	{
		pnlSpinner.setValue(0);
		pnlSpinner.stopTimer();
		pnlSpinnerContainer.showControl(false);
	}

	/*
	* Check if the spinner is visible
	*
	* @return    boolean    The visibility property of pnlSpinner
	*/
	inline function isVisible()
	{
		return pnlSpinner.get("visible");
	}

	// Calls
	hide();
}