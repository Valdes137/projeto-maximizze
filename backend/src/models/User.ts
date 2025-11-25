import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Order } from "./Order";


@Entity("users")
export class User {

    @OneToMany(() => Order, order => order.customer)
    orders!: Order[];

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    name!: string;

    @Column({ type: "longtext", nullable: true })
    avatar!: string;

    @Column("text", { nullable: true })
    description!: string;

    // --- NOVOS CAMPOS DO CLIENTE ---
    @Column({ nullable: true })
    cpf!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    zip_code!: string; // CEP
    // -------------------------------

    @Column({ nullable: true })
    security_question!: string;

    @Column({ nullable: true })
    security_answer_hash!: string;

    @Column({
        type: "enum",
        enum: ["seller", "customer"],
        default: "customer"
    })
    role!: "seller" | "customer";

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    // RELACIONAMENTO: UM USER TEM MUITOS PEDIDOS
   
}
