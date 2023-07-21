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

namespace UserSettings
{
    // Functions
	/**
	* Store a key value pair in the AppData/UserSettings.json file.
	* 
	* @scope	string    	The scope that the value affects. For global settings use "rhapsody".
	*					  	For project specific settings use the project's name or a unique id.
	* @key		string	  	The key that the value is associated with
	* @value	string/int	The value to store
	*/
    inline function setProperty(scope, key, value)
    {
		local obj = {};
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("UserSettings.json");
		
		if (isDefined(f) && f.isFile())
			obj = f.loadAsObject();
			
		if (!isDefined(obj[scope]))
			obj[scope] = {};

		obj[scope][key] = value;
		
		f.writeObject(obj);
    }
    
    /**
    * Store a key value pair in the AppData/UserSettings.json file.
    * 
    * @scope	string    The scope that the value affects. For global settings use "rhapsody".
    *                     For project specific settings use the project's name or a unique id.
    * @key		string    The key for the value you want to retrieve.
    *
    * @return		      The value that matches the scope and key, or undefined
    */
    inline function getProperty(scope, key)
    {
		local obj = {};
	    local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("UserSettings.json");
	    
	    if (isDefined(f) && f.isFile())
	    	obj = f.loadAsObject();

	    return obj[scope][key];
    }
}
