"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import {
  createProfileAndBand,
  isSlugAvailable,
  updateAvailabilityCity as updateAvailabilityCityData,
  updateProfileRole as updateProfileRoleData,
} from "@gigbridge/data";
import type { UserRole } from "@gigbridge/types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Wrappers 'use server' delgados sobre @gigbridge/data — port de
 * GigBridge/gigbridge/src/lib/actions/auth.ts. Todo lo que toca
 * `redirect`/`revalidatePath`/FormData se queda aquí (es Next-específico
 * y una app nativa futura no lo usaría); las mutaciones de negocio
 * (crear profile+band, actualizar rol/ciudad, checar slug) viven en
 * @gigbridge/data/auth/actions.ts para poder reusarlas ahí también.
 */

export async function login(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const role = formData.get("role") as UserRole;
  const slug = (formData.get("slug") as string) || displayName;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role, slug },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (authError) return { error: authError.message };

  if (authData.user) {
    // service-role: justo tras el signUp la sesión aún no está en cookies
    // en este mismo request, así que auth.uid() sería NULL para RLS.
    const serviceClient = createSupabaseServiceRoleClient();
    const created = await createProfileAndBand(serviceClient, {
      userId: authData.user.id,
      slug,
      displayName,
      role,
    });
    if (!created.ok) return { error: created.message };
  }

  revalidatePath("/", "layout");

  if (!authData.session) {
    redirect(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/reset-password`,
  });
  if (error) return { error: error.message };

  return { success: "Revisa tu correo para el enlace de recuperación." };
}

export async function resetPassword(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const password = formData.get("password") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "El enlace de recuperación expiró o no es válido. Solicita uno nuevo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/auth/login");
}

export async function resendConfirmationEmail(email: string) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error) return { error: error.message };

  return { success: "Correo de activación reenviado. Revisa tu bandeja." };
}

export async function updatePassword(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (newPassword !== confirmPassword) return { error: "Las contraseñas nuevas no coinciden." };
  if (newPassword.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "No se pudo verificar tu sesión." };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "La contraseña actual es incorrecta." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: "Contraseña actualizada correctamente." };
}

export async function updateProfileRole(role: UserRole) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No se pudo verificar tu sesión." };

  const { error } = await updateProfileRoleData(supabase, user.id, role);
  if (error) return { error };

  revalidatePath("/", "layout");
  return { success: "Tipo de cuenta actualizado correctamente." };
}

export async function updateAvailabilityCity(city: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No se pudo verificar tu sesión." };

  if (city.trim().length > 100) return { error: "La ciudad no puede superar los 100 caracteres." };

  const { error } = await updateAvailabilityCityData(supabase, user.id, city);
  if (error) return { error };

  revalidatePath("/", "layout");
  return { success: "Ciudad actualizada correctamente." };
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  return isSlugAvailable(supabase, slug);
}
