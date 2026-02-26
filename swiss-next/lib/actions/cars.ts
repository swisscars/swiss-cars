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

    revalidatePath('/admin/cars');
    revalidatePath('/[locale]/cars', 'page');
    revalidatePath('/[locale]/cars/[slug]', 'page');

    return { success: true, id: carId };
}

export async function deleteCar(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/cars');
    return { success: true };
}
