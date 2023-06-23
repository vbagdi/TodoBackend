import { UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { asyncScheduler } from "rxjs";
import { UserEntity } from "src/entity/user.entity";
import { Repository } from "typeorm";

export class JwtCustomStrategy extends PassportStrategy(Strategy){
	constructor(@InjectRepository(UserEntity) private repo:Repository<UserEntity>){
		super({
			jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey : 'warriors'
		});
	}
	async validate(payload : {username:string}){
		const {username} = payload;
		const user =  await this.repo
		.createQueryBuilder()
		.where("username = :username", { username })
		.getOne();
		if(!user){
			throw new UnauthorizedException('Invalid credentials.');
		}
		return user;
	}
}
