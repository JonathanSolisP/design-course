import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Expenses } from '../models/expenses.model';
import dotenv from 'dotenv';

dotenv.config();


const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseKey);

@Injectable()
export class ExpensesService {
  async getExpenses(): Promise<Expenses[]> {
    const { data, error } = await supabase
      .from('expense')
      .select('*');
    console.log(data);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
