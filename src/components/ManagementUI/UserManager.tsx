import { useState, useRef } from "react";
import { Box, Dialog, DialogContent } from "@mui/material";
import UserList from "./UserList";
import type { UserListRef } from "./UserList";
import UserForm from "./UserForm";
import type { User } from "../../types/user";

export default function UserManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Ref to access UserList methods
  const userListRef = useRef<UserListRef>(null);

  const handleCreateUser = () => {
    console.log("Add User button clicked - opening form dialog");
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (userData?: User) => {
    console.log("handleFormSuccess called with userData:", userData);
    console.log("editingUser:", editingUser);

    setIsFormOpen(false);

    if (userData) {
      if (editingUser) {
        // Update existing user
        console.log("Updating existing user:", userData);
        userListRef.current?.updateUserInList(userData);
      } else {
        // Add new user
        console.log("Adding new user:", userData);
        userListRef.current?.addUserToList(userData);
      }
    } else {
      console.log("No userData provided to handleFormSuccess");
    }

    setEditingUser(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  return (
    <Box>
      <UserList
        ref={userListRef}
        onEditUser={handleEditUser}
        onCreateUser={handleCreateUser}
        refreshTrigger={refreshTrigger}
      />

      <Dialog
        open={isFormOpen}
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <UserForm
            user={editingUser}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
