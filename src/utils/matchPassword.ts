import bcrypt from 'bcrypt';

export const matchPassword = async (
  enteredPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};
