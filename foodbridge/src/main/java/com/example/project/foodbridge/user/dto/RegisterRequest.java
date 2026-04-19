package com.example.project.foodbridge.user.dto;

import com.example.project.foodbridge.user.model.Role;

public class RegisterRequest {

    private String email;
    private String password;
    private String organizationName;
    private String contactNumber;
    private Role role;

    // Generate Getters and Setters for all 5 fields!
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
