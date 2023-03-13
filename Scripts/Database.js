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

namespace Database
{
	const db = read();
	
	inline function put(section, key, value)
	{
		if (!isDefined(db[section]))
			db[section] = {};
			
		db[section][key] = value;
		
		write();
	}
	
	inline function get(section, key)
	{
		if (!isDefined(db[section]) || !isDefined(db[section][key]))
			return undefined;
			
		return db[section][key];
	}
	
	inline function write()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("rhapsody-db.json");
		
		f.writeObject(db);
	}
	
	inline function read()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("rhapsody-db.json");
		
		if (isDefined(f) && f.isFile())
			return f.loadAsObject();

		return {};
	}
}