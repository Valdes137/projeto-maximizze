import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { OrderItem } from "./OrderItem";

@Entity("orders")
export class Order {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    total_amount!: number;

    @Column({ default: 'pending' }) // pending, paid, shipped
    status!: string;

    // Quem comprou?
    @ManyToOne(() => User)
    @JoinColumn({ name: "customer_id" })
    customer!: User;

    @Column()
    customer_id!: number;

    // Quais são os itens?
    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items!: OrderItem[];

    @CreateDateColumn()
    created_at!: Date;

   @Column("text", { nullable: true })
    address!: string;
    // ------------

    
}