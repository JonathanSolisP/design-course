import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [ExpensesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
