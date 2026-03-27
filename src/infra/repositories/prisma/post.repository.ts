import type { IPost } from "@/domain/types";
import type { IPostRepository } from "@/domain/types/repositories/post-repository.interface";
import { Post } from "@/domain";
import type { PrismaClient } from "@roastery-adapters/post";
import { SafePrisma } from "@roastery-adapters/post/decorators";
import { EntitySource } from "@roastery/beans/entity/symbols";
import { PrismaPostMapper } from "./prisma-post.mapper";
import { MAX_ITEMS_PER_QUERY } from "@roastery/seedbed/constants";

const DEFAULT_POST_SELECT = {
	id: true,
	createdAt: true,
	updatedAt: true,
	name: true,
	slug: true,
	description: true,
	cover: true,
	postType: {
		select: {
			id: true,
			createdAt: true,
			updatedAt: true,
			isHighlighted: true,
			name: true,
			slug: true,
			schema: true,
		},
	},
	tags: {
		select: {
			id: true,
			createdAt: true,
			updatedAt: true,
			name: true,
			slug: true,
			hidden: true,
		},
	},
} as const;

export class PostRepository implements IPostRepository {
	public constructor(private readonly prisma: PrismaClient) {}

	@SafePrisma(Post[EntitySource])
	async create(post: IPost): Promise<void> {
		const {
			tags: _tags,
			type,
			cover,
			createdAt,
			description,
			id,
			name,
			slug,
			updatedAt,
		} = post;

		const tags: { connect: Array<{ id: string }> } = {
			connect: _tags.map((tag) => ({ id: tag.id })),
		};
		const postTypeId = type.id;

		await this.prisma.post.create({
			data: {
				cover,
				createdAt,
				description,
				id,
				name,
				slug,
				updatedAt,
				postTypeId,
				tags,
			},
		});
	}

	@SafePrisma(Post[EntitySource])
	async findById(id: string): Promise<IPost | null> {
		const targetPost = await this.prisma.post.findUnique({
			where: { id },
			select: DEFAULT_POST_SELECT,
		});

		if (!targetPost) return null;

		return PrismaPostMapper.run(targetPost);
	}

	@SafePrisma(Post[EntitySource])
	async findBySlug(slug: string): Promise<IPost | null> {
		const targetPost = await this.prisma.post.findUnique({
			where: { slug },
			select: DEFAULT_POST_SELECT,
		});

		if (!targetPost) return null;

		return PrismaPostMapper.run(targetPost);
	}

	@SafePrisma(Post[EntitySource])
	async findMany(page: number): Promise<IPost[]> {
		return (
			await this.prisma.post.findMany({
				skip: MAX_ITEMS_PER_QUERY * (page - 1),
				take: MAX_ITEMS_PER_QUERY,
				select: DEFAULT_POST_SELECT,
			})
		).map((item) => PrismaPostMapper.run(item));
	}

	@SafePrisma(Post[EntitySource])
	async findManyByIds(ids: string[]): Promise<Array<IPost | null>> {
		const posts = await this.prisma.post.findMany({
			where: { id: { in: ids } },
			select: DEFAULT_POST_SELECT,
		});

		const postsMap = new Map(posts.map((post) => [post.id, post]));

		return ids.map((id) => {
			const post = postsMap.get(id);
			return post ? PrismaPostMapper.run(post) : null;
		});
	}

	@SafePrisma(Post[EntitySource])
	async findManyByPostType(postTypeId: string, page: number): Promise<IPost[]> {
		return (
			await this.prisma.post.findMany({
				skip: MAX_ITEMS_PER_QUERY * (page - 1),
				take: MAX_ITEMS_PER_QUERY,
				select: DEFAULT_POST_SELECT,
				where: { postTypeId },
			})
		).map((item) => PrismaPostMapper.run(item));
	}

	@SafePrisma(Post[EntitySource])
	async update(post: IPost): Promise<void> {
		const {
			tags: _tags,
			id,
			cover,
			createdAt,
			description,
			name,
			slug,
			updatedAt,
		} = post;

		await this.prisma.post.update({
			where: { id: post.id },
			data: {
				id,
				cover,
				createdAt,
				description,
				name,
				slug,
				updatedAt,
				tags: { set: _tags.map((tag) => ({ id: tag.id })) },
			},
		});
	}

	@SafePrisma(Post[EntitySource])
	async delete(post: IPost): Promise<void> {
		await this.prisma.post.delete({ where: { id: post.id } });
	}

	@SafePrisma(Post[EntitySource])
	async count(): Promise<number> {
		return this.prisma.post.count();
	}

	@SafePrisma(Post[EntitySource])
	countByPostType(postTypeId: string): Promise<number> {
		return this.prisma.post.count({ where: { postTypeId } });
	}
}
