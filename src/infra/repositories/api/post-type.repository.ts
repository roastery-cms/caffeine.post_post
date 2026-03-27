import type { IPostTypeRepository } from "@/domain/types/repositories/post-type-repository.interface";
import type { PostTypeRoutes } from "@roastery-capsules/post.post-type/presentation/routes";
import { treaty } from "@elysiajs/eden";
import type { IPostType } from "@roastery-capsules/post.post-type/domain/types";
import { PostType } from "@roastery-capsules/post.post-type/domain";

export class PostTypeRepository implements IPostTypeRepository {
	private readonly postTagTypeService: ReturnType<
		typeof treaty<PostTypeRoutes>
	>["post-types"];

	public constructor(baseUrl: string) {
		this.postTagTypeService = treaty<PostTypeRoutes>(baseUrl)["post-types"];
	}

	async find(idOrSlug: string): Promise<IPostType | null> {
		const { data, status, error } = await this.postTagTypeService({
			"id-or-slug": idOrSlug,
		}).get();

		if (error) throw error.value;
		if (status !== 200) return null;

		const { isHighlighted, name, schema, slug, ...entityProps } = data;
		entityProps.createdAt = `${(entityProps.createdAt as unknown as Date).toISOString()}`;
		entityProps.updatedAt = entityProps.updatedAt
			? `${(entityProps.updatedAt as unknown as Date).toISOString()}`
			: undefined;

		return PostType.make({ isHighlighted, name, schema, slug }, entityProps);
	}
}
