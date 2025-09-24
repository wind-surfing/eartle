import { createBrowserClient } from "@/supabase/client";
import { SessionUser } from "@/types/User";

export async function createUser(userData: {
  email: string;
  password: string;
  username: string;
}) {
  const supabase = createBrowserClient();

  console.log("Calling create_user_account with:", {
    p_email: userData.email,
    p_password: userData.password,
    p_username: userData.username,
  });

  const { data, error } = await supabase.rpc("create_user_account", {
    p_email: userData.email,
    p_password: userData.password,
    p_username: userData.username,
  });

  if (error) {
    console.error("Create user error:", error);
    return {
      success: false,
      error: error.message || "Failed to create user account",
    };
  }

  console.log("create_user_account response:", data);
  return data;
}

export async function authenticateUser(credentials: {
  identifier: string;
  password: string;
}) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("authenticate_user", {
    p_identifier: credentials.identifier,
    p_password: credentials.password,
  });

  if (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
    };
  }

  return data;
}

export async function verifyUserEmail(email: string, verificationCode: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("verify_user_email", {
    p_identifier: email,
    p_verification_code: verificationCode,
  });

  if (error) {
    console.error("Verification error:", error);
    return {
      success: false,
      error: "Email verification failed",
    };
  }

  return data;
}

export async function resendVerificationCode(email: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("resend_verification_code", {
    p_identifier: email,
  });

  if (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error: "Failed to resend verification code",
    };
  }

  return data;
}

export async function createOrUpdateSocialUser(socialData: {
  email: string;
  name: string;
  image?: string;
}) {
  const supabase = createBrowserClient();

  console.log("Calling createOrUpdateSocialUser with:", socialData);

  const { data: existingUser, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("email", socialData.email)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    console.log("Select error:", selectError);
  }

  if (!existingUser && !selectError) {
    console.log("No existing user found");
  } else if (existingUser) {
    console.log("Existing user found with columns:", Object.keys(existingUser));
  }

  if (existingUser) {
    console.log("Found existing user, updating...");

    const updateData = {
      displayName: socialData.name,
      avatar: socialData.image,
      lastActiveAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await supabase
      .from("users")
      .update(updateData)
      .eq("email", socialData.email);

    return {
      success: true,
      is_new_user: false,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        displayName: socialData.name,
        avatar: socialData.image || existingUser.avatar,
        emailVerified: existingUser.emailVerified || true,
        createdAt: existingUser.createdAt || new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
      },
    };
  }

  console.log("Creating new user via fixed RPC function...");
  const { data, error } = await supabase.rpc("create_or_update_social_user", {
    p_email: socialData.email,
    p_name: socialData.name,
    p_image: socialData.image,
  });

  if (error) {
    console.error("Fixed RPC function failed:", error);
    return {
      success: false,
      error: "Failed to create user: " + error.message,
    };
  }

  if (!data?.success) {
    console.error("Fixed RPC function returned error:", data);
    return {
      success: false,
      error: data?.error || "Failed to create user",
    };
  }

  console.log("Successfully created user via fixed RPC:", data);

  return {
    success: true,
    is_new_user: data.is_new_user || true,
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.username,
      displayName: data.user.displayName || socialData.name,
      avatar: data.user.avatar || null,
      emailVerified: Boolean(data.user.emailVerified),
      createdAt: data.user.createdAt || new Date(),
      updatedAt: data.user.updatedAt || new Date(),
      lastActiveAt: data.user.lastActiveAt || new Date(),
    },
  };
}

export async function updateUserProfile(params: {
  userId: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatar?: string | null;
}) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("update_user_profile", {
    p_user_id: params.userId,
    p_user_name: params.username,
    p_display_name: params.displayName,
    p_bio: params.bio,
    p_avatar: params.avatar,
  });

  if (error) {
    console.error("Update user profile error:", error);
    return { success: false, error: "Error updating profile" } as const;
  }

  return data as { success: boolean; error?: string };
}

export async function getUserPublicProfile({
  userId,
  username,
}: {
  userId?: string;
  username?: string;
}) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("get_user_public_profile", {
    p_user_id: userId ?? null,
    p_username: username ?? null,
  });

  if (error) {
    console.error("Get user public profile error:", error);
    return { success: false, error: "Error fetching profile" } as const;
  }

  if (!data?.success) {
    return { success: false, error: data?.error || "Not found" } as const;
  }

  return data;
}

export async function checkUsernameUnique(username: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("check_username_unique", {
    p_username: username,
  });

  if (error) {
    console.error("Username check error:", error);
    return { success: false, error: "Error checking username" } as const;
  }

  return data as { success: boolean; message?: string };
}

export async function getUserById(userId: string): Promise<SessionUser | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("get_user_by_id", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Get user by ID error:", error);
    return null;
  }

  if (!data?.success || !data.user) {
    return null;
  }

  return data.user as SessionUser;
}

export async function getUserByUsername(
  username: string
): Promise<SessionUser | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.rpc("get_user_by_username", {
    p_username: username,
  });

  if (error) {
    console.error("Get user by username error:", error);
    return null;
  }

  if (!data?.success || !data.user) {
    return null;
  }

  return data.user as SessionUser;
}
