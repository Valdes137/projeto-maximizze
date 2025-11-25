import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("products")
export class Product {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column("text") // Texto longo
    description!: string;

    @Column("decimal", { precision: 10, scale: 2 }) // Ex: 199.90
    price!: number;

    @Column("int")
    stock_quantity!: number;

    @Column({ default: true })
    is_active!: boolean;

    // RELACIONAMENTO: Muitos produtos pertencem a Um usuário
    @ManyToOne(() => User)
    @JoinColumn({ name: "seller_id" })
    seller!: User;
    
    @Column({ type: "longtext", nullable: true })
    image!: string;

    @Column({ type: "varchar", length: 1024, nullable: true })
    image_url!: string | null;

    @Column()
    seller_id!: number; // Coluna auxiliar para facilitar buscas

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
