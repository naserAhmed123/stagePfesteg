import React from 'react';
import { Table } from '../../components/ui/table';

const Table1 = () => {
  const users = [
    {
      name: 'Steven Jobs',
      email: 'jobs@sailboatui.com',
      state: 'Active',
      role: 'Product Designer',
      teams: ['Design', 'Product', 'Develop'],
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    // Repeat similar structure for other users...
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md m-5 dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full border-collapse bg-white text-left text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-300">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">Name</th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">State</th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">Role</th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">Team</th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700">
          {users.map((user, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <th className="flex gap-3 px-6 py-4 font-normal text-gray-900 dark:text-gray-100">
                <div className="relative h-10 w-10">
                  <img
                    className="h-full w-full rounded-full object-cover object-center"
                    src={user.image}
                    alt={user.name}
                  />
                  <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-green-400 ring ring-white"></span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-200">{user.name}</div>
                  <div className="text-gray-400 dark:text-gray-400">{user.email}</div>
                </div>
              </th>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-800 dark:text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                  {user.state}
                </span>
              </td>
              <td className="px-6 py-4">{user.role}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {user.teams.map((team, index) => (
                    <span key={index} className={`inline-flex items-center gap-1 rounded-full bg-${getColor(team)}-50 px-2 py-1 text-xs font-semibold text-${getColor(team)}-600 dark:bg-${getColor(team)}-800 dark:text-${getColor(team)}-300`}>
                      {team}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-4">
                  <a href="#" data-tooltip="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6" data-tooltip="Delete">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                    </svg>
                  </a>
                  <a href="#" data-tooltip="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6" data-tooltip="Edit">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>
                    </svg>
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getColor = (team) => {
  switch (team) {
    case 'Design':
      return 'blue';
    case 'Product':
      return 'indigo';
    case 'Develop':
      return 'violet';
    default:
      return 'gray';
  }
};

export default Table1;
