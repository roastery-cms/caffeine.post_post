import { Post } from "@/domain";
import {
	CreatePostController,
	DeletePostController,
	FindManyPostsController,
	FindPostController,
	UpdatePostController,
} from "../controllers";
import type { IControllersWithAuth } from "../controllers/types/controllers-with-auth.interface";
import type { IControllersWithoutAuth } from "../controllers/types/controllers-without-auth.interface";
import PostsTag from "../tags";
import { EntitySource } from "@roastery/beans/entity/symbols";
import { barista } from "@roastery/barista";

type PostRoutesArgs = IControllersWithAuth;

export function PostRoutes(data: PostRoutesArgs) {
	const { postRepository, postTagRepository, postTypeRepository } = data;
	const controllersWithoutAuth: IControllersWithoutAuth = {
		postRepository,
		postTagRepository,
		postTypeRepository,
	};

	return barista({
		prefix: "/posts",
		detail: { tags: [PostsTag.name] },
		name: Post[EntitySource],
	})
		.use(CreatePostController(data))
		.use(DeletePostController(data))
		.use(UpdatePostController(data))
		.use(FindPostController(controllersWithoutAuth))
		.use(FindManyPostsController(controllersWithoutAuth));
}

export type PostRoutes = ReturnType<typeof PostRoutes>;
