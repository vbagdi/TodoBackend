import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from 'src/DTO/registerUser.dto';
import { UserEntity } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserLoginDto } from 'src/DTO/userLogin.dto';
import { JwtService } from '@nestjs/jwt';
import { throwError } from 'rxjs';

@Injectable()
export class AuthService {
	constructor(@InjectRepository(UserEntity) private repo: Repository<UserEntity>, private jwt:JwtService){

	}
	async registerUser(registerDTO: RegisterUserDto ){
		const {username,password} = registerDTO;
		const hashed = await bcrypt.hash(password,12);
		const salt = await bcrypt.getSalt(hashed);

		const foundUser = await this.repo
		.createQueryBuilder()
		.where("username = :username", { username })
		.getOne();

		if(foundUser){
			throw new BadRequestException();

		}
		else{
			const user = new UserEntity();
			user.username = username;
			user.password =  hashed;
			user.salt = salt;

			this.repo.create(user);
			try{
				return await this.repo.save(user);
			} catch(err){
				throw new InternalServerErrorException('Something went wrong, user was not created');
			}
		}
	}

	async logInUser(userLoginDto:UserLoginDto){
		const {username,password} = userLoginDto;
		const user =  this.repo
		.createQueryBuilder()
		.where("username = :username", { username })
		.getOne();
		if(!user){
			throw new UnauthorizedException('Invalid credentials.');
		}
		const isMatch = await bcrypt.compare(password,(await user).password);
		if(isMatch){
			const jwtpayload = {username};
			const jwtToken  = await this.jwt.signAsync(jwtpayload,{expiresIn:'1d'})
			return {token:jwtToken};
		}else{
			throw new UnauthorizedException('Invalid credentials.');
		}
	}
}
