import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("order_items")
export class OrderItem {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column("int")
    quantity!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    unit_price!: number; // Preço NO MOMENTO da compra

    // Pertence a qual pedido?
    @ManyToOne(() => Order, order => order.items)
    @JoinColumn({ name: "order_id" })
    order!: Order;

    // É qual produto?
    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column()
    product_id!: number;
}