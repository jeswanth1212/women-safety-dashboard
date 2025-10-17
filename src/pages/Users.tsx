import { useState, useEffect } from 'react';
import { Users as UsersIcon, Phone, MapPin, Mail } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Contact {
  name: string;
  phoneNumber: string;
}

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  age: number;
  address: string;
  contacts: Contact[];
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedUsers.push({
          id: doc.id,
          name: data.name || 'Unknown',
          phoneNumber: data.phoneNumber || 'N/A',
          age: data.age || 0,
          address: data.address || 'N/A',
          contacts: data.contacts || []
        });
      });
      setUsers(fetchedUsers);
      setLoading(false);
      console.log('Fetched users from Firestore:', fetchedUsers);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Registered Users</h2>
        <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
          <UsersIcon className="h-5 w-5 mr-2" />
          <span className="font-semibold">{users.length} Total Users</span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No users found in the system
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              {/* User Header */}
              <div className="flex items-center mb-4">
                <img
                  className="h-16 w-16 rounded-full mr-4"
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`}
                  alt={user.name}
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-500">Age: {user.age}</p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-800">{user.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-800">{user.address}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              {user.contacts && user.contacts.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contacts</h4>
                  <div className="space-y-2">
                    {user.contacts.map((contact, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                        <p className="text-xs text-gray-600">{contact.phoneNumber}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;