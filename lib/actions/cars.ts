'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type Car } from '@/lib/types';

export async function saveCar(carData: Car & { car_images?: { url: string, is_primary: boolean }[] }) {
    const supabase = await createClient();

    const { car_images, ...rawCar } = carData;

    // Filter only valid columns for the 'cars' table
    const car: any = {
        slug: rawCar.slug,
        brand: rawCar.brand,
        model: rawCar.model,
        year: rawCar.year,
        price: rawCar.price,
        mileage: rawCar.mileage,
        fuel_type: rawCar.fuel_type,
        transmission: rawCar.transmission,
        engine_cc: rawCar.engine_cc,
        color_exterior: rawCar.color_exterior,
        color_interior: rawCar.color_interior,
        body_type: rawCar.body_type,
        drive: rawCar.drive,
        seats: rawCar.seats,
        is_featured: rawCar.is_featured,
        is_available: rawCar.is_available,
        description: rawCar.description,
        features: rawCar.features,
    };

    let carId = rawCar.id;

    if (carId) {
        // Update existing car
        const { error } = await supabase
            .from('cars')
            .update(car)
            .eq('id', carId);

        if (error) throw error;
    } else {
        // Insert new car
        const { data, error } = await supabase
            .from('cars')
            .insert(car)
            .select()
            .single();

        if (error) throw error;
        carId = data.id;
    }

    // Handle images
    if (car_images && carId) {
        // Delete old images association (simpler than syncing for now)
        await supabase.from('car_images').delete().eq('car_id', carId);

        // Insert new image associations
        const imagesToInsert = car_images.map(img => ({
            car_id: carId,
            url: img.url,
            is_primary: img.is_primary
        }));

        const { error: imgError } = await supabase
            .from('car_images')
            .insert(imagesToInsert);

        if (imgError) throw imgError;
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/[locale]/inventory', 'page');
    revalidatePath('/[locale]/inventory/[slug]', 'page');

    return { success: true, id: carId };
}

export async function deleteCar(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/inventory');
    return { success: true };
}

export async function duplicateCar(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Fetch original car and its images
    const { data: car, error: carError } = await supabase
        .from('cars')
        .select('*, car_images(*)')
        .eq('id', id)
        .single();

    if (carError || !car) throw new Error('Car not found');

    const { id: oldId, created_at, updated_at, car_images, ...rawCar } = car;

    // 2. Prepare cloned data (omit system fields)
    const clonedCar: any = {
        slug: `${rawCar.slug}-${Date.now()}`,
        brand: rawCar.brand,
        model: rawCar.model,
        year: rawCar.year,
        price: rawCar.price,
        mileage: rawCar.mileage,
        fuel_type: rawCar.fuel_type,
        transmission: rawCar.transmission,
        engine_cc: rawCar.engine_cc,
        color_exterior: rawCar.color_exterior,
        color_interior: rawCar.color_interior,
        body_type: rawCar.body_type,
        drive: rawCar.drive,
        seats: rawCar.seats,
        is_featured: rawCar.is_featured,
        is_available: true, // Always available by default
        description: rawCar.description,
        features: rawCar.features,
    };

    // 3. Insert new car
    const { data: newCar, error: insertError } = await supabase
        .from('cars')
        .insert(clonedCar)
        .select()
        .single();

    if (insertError) throw insertError;

    // 4. Duplicate images
    if (car_images && car_images.length > 0) {
        const imagesToInsert = car_images.map((img: any) => ({
            car_id: newCar.id,
            url: img.url,
            is_primary: img.is_primary
        }));

        const { error: imgError } = await supabase
            .from('car_images')
            .insert(imagesToInsert);

        if (imgError) throw imgError;
    }

    revalidatePath('/admin/inventory');
    return { success: true, id: newCar.id };
}
