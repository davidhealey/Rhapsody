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

Content.makeFrontInterface(1000, 710);

const MODE = "development";

Synth.deferCallbacks(true);

Engine.loadAudioFilesIntoPool();

// Includes
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Ui.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Expansions.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/LookAndFeel.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Paths.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Header.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Footer.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Presets.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/UserSettings.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/Spinner.js");
include("{GLOBAL_SCRIPT_FOLDER}RhapsodyBoilerplate/includes/FilePicker.js");
include("UpdateChecker.js");
include("SplashScreen.js");
function onNoteOn()
{
	
}
 function onNoteOff()
{
	
}
 function onController()
{
	
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
 