export default function UsersTable({ users }) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td className="user-name">{user.name}</td>
            <td>{user.email}</td>
            <td>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </td>
            <td>
              <span className={`status-${user.status}`}>
                <span className="status-dot" />
                {user.status}
              </span>
            </td>
            <td>{user.joined}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
