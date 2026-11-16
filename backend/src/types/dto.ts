// รูปแบบข้อมูลที่ส่งให้หน้าเว็บ — ต้องตรงกับ frontend/src/types/*.ts

export type Species = "DOG" | "CAT" | "OTHER";
export type Sex = "MALE" | "FEMALE";
export type PetStatus = "AVAILABLE" | "PENDING" | "ADOPTED";
export type Housing = "HOUSE" | "CONDO" | "DORM";
export type AdoptionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Pet {
  id: number;
  name: string;
  species: Species;
  breed: string;
  ageMonths: number;
  sex: Sex;
  province: string;
  imageUrl: string;
  description: string;
  vaccinated: boolean;
  sterilized: boolean;
  urgent: boolean;
  status: PetStatus;
  createdAt: string;
  ownerId: string;
  ownerName: string;
}

export interface AdoptionRequest {
  id: number;
  petId: number;
  userId: string;
  userName: string;
  phone: string;
  housing: Housing;
  message: string;
  status: AdoptionStatus;
  createdAt: string;
  pet: Pet;
}
