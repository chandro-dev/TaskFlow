import type { RegisterUserInput, UserProfile, UserRole } from "@/lib/domain/models";

abstract class UserProfileFactory {
  create(input: RegisterUserInput): UserProfile {
    const normalizedName = input.name.trim();
    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      name: normalizedName,
      email: input.email.trim().toLowerCase(),
      role: this.role(),
      avatar: this.initials(normalizedName),
      bio: this.defaultBio(normalizedName),
      lastAccess: now,
      themePreference: "light",
      isActive: true,
    };
  }

  protected abstract role(): UserRole;

  protected defaultBio(name: string) {
    return `${name} registrado recientemente en Taskflow.`;
  }

  private initials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
}

class DeveloperProfileFactory extends UserProfileFactory {
  protected role(): UserRole {
    return "DEVELOPER";
  }
}

export function createUserProfileFactory() {
  return new DeveloperProfileFactory();
}
