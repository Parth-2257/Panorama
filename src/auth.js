const { readData } = require('./storage');

/**
 * Authenticates a user by matching username and password against data.json.
 * @param {string} username - User login username
 * @param {string} password - User password
 * @returns {Promise<object|null>} The authenticated user object with department details, or null if invalid
 */
async function login(username, password) {
  if (!username || !password) {
    return null;
  }

  const data = await readData();
  const trimmedUsername = username.trim();

  // Find user by username and matching passwordHash
  const user = data.users.find(
    (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    return null;
  }

  // Attach department details if user belongs to a department
  let department = null;
  if (user.departmentId) {
    department = data.departments.find((d) => d.id === user.departmentId) || null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role, // 'ADMIN' or 'DEPARTMENT_USER'
    departmentId: user.departmentId,
    department: department,
  };
}

module.exports = {
  login,
};
