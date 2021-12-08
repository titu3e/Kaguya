import { FORMATS, GENRES, SEASONS, SEASON_YEARS } from "@/constants";
import useBrowse, { UseBrowseOptions } from "@/hooks/useBrowseManga";
import TAGS from "@/tags.json";
import { convert } from "@/utils/data";
import { debounce } from "debounce";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { AiOutlineSearch } from "react-icons/ai";
import List from "../shared/List";
import Head from "../shared/Head";
import Input from "../shared/Input";
import InView from "../shared/InView";
import Select from "../shared/Select";
import AnimeListSkeleton from "../skeletons/AnimeListSkeleton";
import SortSelector from "./SortSelector";

const initialValues: UseBrowseOptions = {
  format: undefined,
  keyword: "",
  genre: undefined,
  tag: undefined,
  sort: "average_score",
  type: "manga",
};

const genres = GENRES.map((genre) => ({
  value: genre.value as string,
  placeholder: convert(genre.value, "genre"),
}));

const formats = FORMATS.map((format) => ({
  value: format,
  placeholder: convert(format, "format"),
}));

const tags = TAGS.map((tag) => ({
  value: tag,
  placeholder: tag,
}));

interface BrowseListProps {
  defaultQuery?: UseBrowseOptions;
  title?: string;
}

const BrowseList: React.FC<BrowseListProps> = ({
  defaultQuery = initialValues,
  title,
}) => {
  const defaultValues = { ...initialValues, ...defaultQuery };

  const {
    control,
    register,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<UseBrowseOptions>({
    defaultValues,
  });

  const router = useRouter();

  const query = watch();

  const {
    data,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isError,
  } = useBrowse(query);

  const handleFetch = () => {
    if (isFetchingNextPage || !hasNextPage) return;

    fetchNextPage();
  };

  const handleInputChange = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue("keyword", e.target.value),
    500
  );

  const totalData = data?.pages.map((el) => el.data).flat();

  useEffect(() => {
    if (!isDirty) return;

    // Reset isDirty to false
    reset(query);

    const truthyQuery = {};

    Object.keys(query).forEach((key) => {
      if (!query[key]) return;

      truthyQuery[key] = query[key];
    });

    router.replace({ query: truthyQuery, pathname: "/browse" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  return (
    <div className="min-h-screen px-4 md:px-12">
      <Head title={`${title} - Kaguya` || "Kaguya"} />

      {title && (
        <p className="mb-8 text-4xl font-semibold text-center md:text-left">
          {title}
        </p>
      )}

      <form className="space-y-4">
        <div className="flex items-center -my-2 space-x-2 overflow-x-auto lg:flex-wrap lg:justify-between lg:space-x-0 lg:overflow-x-visible snap-x lg:snap-none">
          <Input
            {...register("keyword")}
            containerClassName="my-2"
            LeftIcon={AiOutlineSearch}
            onChange={handleInputChange}
            defaultValue={defaultValues.keyword}
            label="Tìm kiếm"
          />

          <Controller
            name="genre"
            control={control}
            defaultValue={defaultValues.genre}
            render={({ field: { value, onChange } }) => (
              <Select
                containerClassName="my-2"
                defaultValue={value}
                label="Thể loại"
                data={genres}
                onChange={onChange}
              />
            )}
          />

          <Controller
            name="format"
            control={control}
            defaultValue={defaultValues.format}
            render={({ field: { value, onChange } }) => (
              <Select
                containerClassName="my-2"
                defaultValue={value}
                label="Định dạng"
                data={formats}
                onChange={onChange}
              />
            )}
          />

          <Controller
            name="tag"
            control={control}
            defaultValue={defaultValues.tag}
            render={({ field: { value, onChange } }) => (
              <Select
                containerClassName="my-2"
                defaultValue={value}
                label="Tag"
                data={tags}
                onChange={onChange}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            defaultValue={defaultValues.type}
            render={({ field: { value, onChange } }) => (
              <Select
                containerClassName="my-2"
                defaultValue={value}
                label="Loại tìm kiếm"
                data={[
                  {
                    value: "anime",
                    placeholder: "Anime",
                  },
                  {
                    value: "manga",
                    placeholder: "Manga",
                  },
                ]}
                onChange={onChange}
                defaultItem={{ value: "", placeholder: "" }}
              />
            )}
          />
        </div>

        <div className="flex items-end justify-end">
          <Controller
            name="sort"
            control={control}
            defaultValue={defaultQuery.sort}
            render={({ field: { value, onChange } }) => (
              <SortSelector defaultValue={value} onChange={onChange} />
            )}
          />
        </div>
      </form>

      <div className="mt-8">
        {!isLoading && query ? (
          <React.Fragment>
            <List type="manga" data={totalData} />

            {isFetchingNextPage && !isError && (
              <div className="mt-4">
                <AnimeListSkeleton />
              </div>
            )}

            {((totalData.length && !isFetchingNextPage) || hasNextPage) && (
              <InView onInView={handleFetch} />
            )}

            {!hasNextPage && !!totalData.length && (
              <p className="mt-8 text-2xl text-center">Hết rồi...</p>
            )}
          </React.Fragment>
        ) : (
          <AnimeListSkeleton />
        )}
      </div>
    </div>
  );
};

export default BrowseList;