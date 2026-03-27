import type { IPostTagRepository } from "@/domain/types/repositories/post-tag-repository.interface";
import { treaty } from "@elysiajs/eden";
import type { PostTagRoutes } from "@roastery-capsules/post.post-tag/presentation/routes";
import { PostTag } from "@roastery-capsules/post.post-tag/domain";
import type { IPostTag } from "@roastery-capsules/post.post-tag/domain/types";

export class PostTagRepository implements IPostTagRepository {
	private readonly postTagService: ReturnType<
		typeof treaty<PostTagRoutes>
	>["post-tags"];

	public constructor(baseUrl: string) {
		this.postTagService = treaty<PostTagRoutes>(baseUrl)["post-tags"];
	}

	async find(idOrSlug: string): Promise<IPostTag | null> {
		const { data, status, error } = await this.postTagService({
			"id-or-slug": idOrSlug,
		}).get();

		if (error) throw error.value;
		if (status !== 200) return null;

		const { name, slug, hidden, ...entityProps } = data;
		entityProps.createdAt = `${(entityProps.createdAt as unknown as Date).toISOString()}`;
		entityProps.updatedAt = entityProps.updatedAt
			? `${(entityProps.updatedAt as unknown as Date).toISOString()}`
			: undefined;

		return PostTag.make({ name, slug, hidden }, entityProps);
	}
}
